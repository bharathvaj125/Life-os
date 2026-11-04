import "server-only";
import { randomUUID } from "node:crypto";
import type { Snapshot } from "@/types";
import { calculateFootprint, trendOf } from "@/lib/calculations/footprint";
import { getRepository } from "@/lib/store";
import type { FootprintBody } from "@/lib/validation";

export async function saveSnapshot(userId: string, input: FootprintBody): Promise<Snapshot> {
  const { period, ...inputs } = input;
  return getRepository().upsertSnapshot({
    ...inputs,
    ...calculateFootprint(inputs),
    id: randomUUID(),
    userId,
    period,
    createdAt: new Date().toISOString(),
  });
}

export async function listSnapshots(userId: string): Promise<Snapshot[]> {
  return (await getRepository().listSnapshots(userId)).sort((a, b) => a.period.localeCompare(b.period));
}

export async function getFootprintView(userId: string) {
  const snapshots = await listSnapshots(userId);
  return { snapshots, trend: trendOf(snapshots) };
}
