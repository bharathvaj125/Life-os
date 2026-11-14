import "server-only";
import { randomUUID } from "node:crypto";
import type { Completion, Task, TaskProof, TaskProofStatus, User } from "@/types";
import { getTaskFor, taskApplies, taskBlockReason, tasksFor } from "@/features/gamification/tasks";
import { BILL_SAVINGS_TASK_ID } from "@/lib/calculations/bill-savings";
import { generateNudges } from "@/lib/calculations/nudges";
import { DAILY_GOAL_POINTS, computeStreak, dedupeKeyFor, evaluateCompletion, levelFor } from "@/lib/calculations/gamification";
import { istDate, istHour } from "@/lib/dates";
import { getRepository } from "@/lib/store";
import { ApiError } from "@/lib/api";
import { listSnapshots } from "./footprint";
import { getTodayMaxTemp, getWeatherForPincode } from "./weather";

export interface TaskView extends Task {
  doneInWindow: boolean;
  /** Why it cannot be claimed right now (time window or weather), or null. */
  blockedReason: string | null;
  /** For photo-proof tasks: where the household's photo stands. Null when none has been sent, or for ordinary tasks. */
  proofStatus: TaskProofStatus | null;
}

/** Bill-based bonuses are monthly, so they count toward points and impact but not the daily goal or the daily streak. */
const isHabit = (c: Completion) => c.taskId !== BILL_SAVINGS_TASK_ID;

export async function getProgress(userId: string, now: Date = new Date()) {
  const completions = await getRepository().listCompletions(userId);
  const today = istDate(now);
  const points = completions.reduce((sum, c) => sum + c.points, 0);
  return {
    points,
    pointsToday: completions.filter((c) => c.completedOn === today && isHabit(c)).reduce((sum, c) => sum + c.points, 0),
    dailyGoal: DAILY_GOAL_POINTS,
    kgAvoided: Math.round(completions.reduce((sum, c) => sum + c.impactKg, 0) * 10) / 10,
    completionsCount: completions.length,
    streak: computeStreak(completions.filter(isHabit).map((c) => c.completedOn), today),
    level: levelFor(points),
    completions,
  };
}

export async function getActionsView(user: User, now: Date = new Date()) {
  const [snapshots, progress, weather, proofs] = await Promise.all([listSnapshots(user.id), getProgress(user.id, now), getWeatherForPincode(user.pincode), getRepository().listTaskProofs({ userId: user.id })]);
  const today = istDate(now);
  const done = new Set(progress.completions.map((c) => c.dedupeKey));
  // The forecast Open-Meteo gave us, or failing that a second provider, so the AC rule can apply even when Open-Meteo refuses our server.
  const maxC = weather ? weather.today.maxC : await getTodayMaxTemp(user.pincode);
  const hour = istHour(now);
  const tasks: TaskView[] = tasksFor(user.equipment, user.roofAccess).map((t) => ({ ...t, doneInWindow: done.has(dedupeKeyFor(t, today)), blockedReason: taskBlockReason(t, { hour, maxC }), proofStatus: latestProofStatus(proofs, t.id) }));
  return { nudges: generateNudges({ householdSize: user.householdSize, snapshots, now, weather, equipment: user.equipment, roofAccess: user.roofAccess }), tasks, progress, weather, snapshots };
}

/** The newest proof for a task decides what the card shows. */
function latestProofStatus(proofs: TaskProof[], taskId: string): TaskProofStatus | null {
  const mine = proofs.filter((p) => p.taskId === taskId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return mine.length ? mine[mine.length - 1].status : null;
}

/**
 * Ticks a task. Tasks that need a photo cannot be ticked here: they are awarded only when an administrator
 * approves the photo, which calls this with `approvedProof`. An approved photo is already checked by a person,
 * so it is not held back by the daily points cap.
 */
export async function completeTask(user: User, taskId: string, now: Date = new Date(), opts: { approvedProof?: boolean } = {}): Promise<Completion> {
  const task = getTaskFor(taskId, user.equipment);
  if (!task) throw new ApiError(404, "That task does not exist.");
  if (!taskApplies(task, user.equipment, user.roofAccess)) throw new ApiError(403, "That task does not apply to your home.");
  if (task.proof && !opts.approvedProof) throw new ApiError(403, "This one needs a photo. Send it from the Actions page and an administrator will check it.");
  // Only the AC task needs the forecast, so only it pays for a weather lookup.
  const blocked = taskBlockReason(task, { hour: istHour(now), maxC: task.id === "ac-setpoint" ? await getTodayMaxTemp(user.pincode) : null });
  if (blocked) throw new ApiError(403, blocked);
  const repo = getRepository();
  const today = istDate(now);
  const mine = await repo.listCompletions(user.id);
  const result = evaluateCompletion(task, new Set(mine.map((c) => c.dedupeKey)), today);
  if (!result.ok) throw new ApiError(409, result.reason);
  // The store enforces uniqueness again, so two simultaneous requests still cannot double-award.
  const saved = await repo.addCompletion({ id: randomUUID(), userId: user.id, taskId, dedupeKey: result.dedupeKey, completedOn: today, points: result.points, impactKg: result.impactKg, createdAt: now.toISOString() });
  if (!saved.created) throw new ApiError(409, "You have already completed this task.");
  return saved.completion;
}
