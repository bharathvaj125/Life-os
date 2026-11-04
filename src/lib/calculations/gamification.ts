import type { Challenge, Completion, Membership, Task } from "@/types";
import { addDays, isoWeekKey } from "@/lib/dates";
import { EMISSION_FACTORS } from "./emission-factors";

export const MAX_DAILY_POINTS = 80;

export function dedupeKeyFor(task: Task, date: string): string {
  if (task.cadence === "daily") return `${task.id}:${date}`;
  if (task.cadence === "weekly") return `${task.id}:${isoWeekKey(date)}`;
  return `${task.id}:once`;
}

export function impactKgOf(task: Task): number {
  return Math.round((task.kwhSaved * EMISSION_FACTORS.electricityKgPerKwh + task.kgSaved) * 100) / 100;
}

export type Evaluation = { ok: true; dedupeKey: string; points: number; impactKg: number } | { ok: false; reason: string };

/**
 * Decides whether a self-reported completion earns points. Server-side only: the client never sets points.
 * Two guards against gaming: one reward per task per cadence window, and a daily points ceiling.
 */
export function evaluateCompletion(task: Task, existingKeys: ReadonlySet<string>, pointsToday: number, date: string): Evaluation {
  const dedupeKey = dedupeKeyFor(task, date);
  if (existingKeys.has(dedupeKey)) {
    const when = task.cadence === "daily" ? "today" : task.cadence === "weekly" ? "this week" : "already";
    return { ok: false, reason: `You have already completed this ${when === "already" ? "task" : `task ${when}`}.` };
  }
  if (pointsToday + task.points > MAX_DAILY_POINTS) return { ok: false, reason: `Daily points limit of ${MAX_DAILY_POINTS} reached. Come back tomorrow.` };
  return { ok: true, dedupeKey, points: task.points, impactKg: impactKgOf(task) };
}

/** Current streak counts back from today, or from yesterday if nothing is logged yet today. */
export function computeStreak(dates: string[], today: string): { current: number; longest: number } {
  const days = new Set(dates);
  let current = 0;
  let cursor = days.has(today) ? today : addDays(today, -1);
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  let longest = 0;
  let run = 0;
  for (const d of [...days].sort()) {
    run = days.has(addDays(d, -1)) ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return { current, longest };
}

const LEVELS = [
  { name: "Seedling", from: 0 },
  { name: "Sprout", from: 50 },
  { name: "Sapling", from: 150 },
  { name: "Grove", from: 400 },
  { name: "Forest", from: 900 },
];

export function levelFor(points: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => { if (points >= l.from) idx = i; });
  const next = LEVELS[idx + 1];
  return { level: idx + 1, name: LEVELS[idx].name, nextAt: next?.from ?? null, toNext: next ? next.from - points : 0 };
}

export interface ChallengeProgress {
  value: number;
  target: number;
  pct: number;
  members: number;
}

/** Progress counts only completions by members, made inside the challenge window. */
export function challengeProgress(challenge: Challenge, memberships: Membership[], completions: Completion[]): ChallengeProgress {
  const memberIds = new Set(memberships.filter((m) => m.challengeId === challenge.id).map((m) => m.userId));
  const counted = completions.filter((c) => memberIds.has(c.userId) && c.completedOn >= challenge.startsOn && c.completedOn <= challenge.endsOn);
  const raw = challenge.metric === "actions" ? counted.length : counted.reduce((sum, c) => sum + c.impactKg, 0);
  const value = Math.round(raw * 10) / 10;
  return { value, target: challenge.target, pct: Math.min(100, Math.round((value / challenge.target) * 100)), members: memberIds.size };
}
