import "server-only";
import { randomUUID } from "node:crypto";
import type { Snapshot } from "@/types";
import { BILL_SAVINGS_TASK_ID, evaluateBillSavings, type BillSavingsBonus } from "@/lib/calculations/bill-savings";
import { calculateFootprint, trendOf } from "@/lib/calculations/footprint";
import { istDate, istPeriod, shiftPeriod } from "@/lib/dates";
import { getRepository } from "@/lib/store";
import type { FootprintBody } from "@/lib/validation";

/**
 * Saves one month. If the units fell against the month before, it also awards the bill-based savings bonus,
 * once per month: the store's unique key makes a second award impossible even for repeated saves.
 */
export async function saveSnapshot(userId: string, input: FootprintBody, now: Date = new Date()): Promise<{ snapshot: Snapshot; bonus: BillSavingsBonus | null }> {
  const { period, ...inputs } = input;
  const repo = getRepository();
  const snapshot = await repo.upsertSnapshot({
    ...inputs,
    ...calculateFootprint(inputs),
    id: randomUUID(),
    userId,
    period,
    createdAt: now.toISOString(),
  });

  const previous = (await repo.listSnapshots(userId)).find((s) => s.period === shiftPeriod(period, -1));
  const bonus = evaluateBillSavings(previous, snapshot, istPeriod(now));
  if (!bonus) return { snapshot, bonus: null };
  const saved = await repo.addCompletion({ id: randomUUID(), userId, taskId: BILL_SAVINGS_TASK_ID, dedupeKey: bonus.dedupeKey, completedOn: istDate(now), points: bonus.points, impactKg: bonus.impactKg, createdAt: now.toISOString() });
  return { snapshot, bonus: saved.created ? bonus : null };
}

export async function listSnapshots(userId: string): Promise<Snapshot[]> {
  return (await getRepository().listSnapshots(userId)).sort((a, b) => a.period.localeCompare(b.period));
}

export async function getFootprintView(userId: string) {
  const snapshots = await listSnapshots(userId);
  return { snapshots, trend: trendOf(snapshots) };
}
