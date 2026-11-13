import "server-only";
import { randomUUID } from "node:crypto";
import type { Completion, Task, User } from "@/types";
import { TASKS, getTask } from "@/features/gamification/tasks";
import { BILL_SAVINGS_TASK_ID } from "@/lib/calculations/bill-savings";
import { generateNudges } from "@/lib/calculations/nudges";
import { MAX_DAILY_POINTS, computeStreak, dedupeKeyFor, evaluateCompletion, levelFor } from "@/lib/calculations/gamification";
import { istDate } from "@/lib/dates";
import { getRepository } from "@/lib/store";
import { ApiError } from "@/lib/api";
import { listSnapshots } from "./footprint";
import { getWeatherForPincode } from "./weather";

export interface TaskView extends Task {
  doneInWindow: boolean;
}

/** Bill-based bonuses are monthly, so they count toward points and impact but not the daily cap or the daily streak. */
const isHabit = (c: Completion) => c.taskId !== BILL_SAVINGS_TASK_ID;

export async function getProgress(userId: string, now: Date = new Date()) {
  const completions = await getRepository().listCompletions(userId);
  const today = istDate(now);
  const points = completions.reduce((sum, c) => sum + c.points, 0);
  return {
    points,
    pointsToday: completions.filter((c) => c.completedOn === today && isHabit(c)).reduce((sum, c) => sum + c.points, 0),
    dailyLimit: MAX_DAILY_POINTS,
    kgAvoided: Math.round(completions.reduce((sum, c) => sum + c.impactKg, 0) * 10) / 10,
    completionsCount: completions.length,
    streak: computeStreak(completions.filter(isHabit).map((c) => c.completedOn), today),
    level: levelFor(points),
    completions,
  };
}

export async function getActionsView(user: User, now: Date = new Date()) {
  const [snapshots, progress, weather] = await Promise.all([listSnapshots(user.id), getProgress(user.id, now), getWeatherForPincode(user.pincode)]);
  const today = istDate(now);
  const done = new Set(progress.completions.map((c) => c.dedupeKey));
  const tasks: TaskView[] = TASKS.map((t) => ({ ...t, doneInWindow: done.has(dedupeKeyFor(t, today)) }));
  return { nudges: generateNudges({ householdSize: user.householdSize, snapshots, now, weather }), tasks, progress, weather };
}

export async function completeTask(user: User, taskId: string, now: Date = new Date()): Promise<Completion> {
  const task = getTask(taskId);
  if (!task) throw new ApiError(404, "That task does not exist.");
  const repo = getRepository();
  const today = istDate(now);
  const mine = await repo.listCompletions(user.id);
  const result = evaluateCompletion(
    task,
    new Set(mine.map((c) => c.dedupeKey)),
    mine.filter((c) => c.completedOn === today && isHabit(c)).reduce((sum, c) => sum + c.points, 0),
    today,
  );
  if (!result.ok) throw new ApiError(409, result.reason);
  // The store enforces uniqueness again, so two simultaneous requests still cannot double-award.
  const saved = await repo.addCompletion({ id: randomUUID(), userId: user.id, taskId, dedupeKey: result.dedupeKey, completedOn: today, points: result.points, impactKg: result.impactKg, createdAt: now.toISOString() });
  if (!saved.created) throw new ApiError(409, "You have already completed this task.");
  return saved.completion;
}
