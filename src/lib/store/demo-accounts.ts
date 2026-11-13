import type { Completion, Equipment, Snapshot, User, Vendor } from "@/types";
import { EMPTY_EQUIPMENT } from "@/features/equipment/catalog";
import { getTask } from "@/features/gamification/tasks";
import { calculateFootprint } from "@/lib/calculations/footprint";
import { dedupeKeyFor, impactKgOf } from "@/lib/calculations/gamification";
import { addDays, istDate, istPeriod, shiftPeriod } from "@/lib/dates";
import { demoUserId, type DemoKey } from "@/features/demo/accounts";

const equip = (over: Partial<Equipment>): Equipment => ({ ...EMPTY_EQUIPMENT, ...over });

interface Spec {
  user: Omit<User, "id" | "createdAt" | "isDemo" | "leaderboardOptIn">;
  /** Units for the last three months, oldest first. */
  kwh?: [number, number, number];
  rate?: number;
  extras?: { lpgCylinders: number; carKm: number; bikeKm: number; publicKm: number };
  /** [task id, days ago]. Only tasks that apply to the home. */
  done?: [string, number][];
  challenges?: string[];
}

const SPECS: Record<DemoKey, Spec> = {
  patel: {
    user: {
      role: "citizen", displayName: "Patel family (demo)", pincode: "380015", householdSize: 4, homeType: "apartment", ownership: "tenant", roofAccess: "shared",
      equipment: equip({ acCount: 2, geyser: true, washingMachine: true, lpg: true, petrolTwoWheeler: true, inverterBattery: true }),
    },
    kwh: [318, 301, 276],
    rate: 6.9,
    extras: { lpgCylinders: 1, carKm: 0, bikeKm: 180, publicKm: 60 },
    done: [["ac-setpoint", 0], ["standby-off", 1], ["geyser-short", 1], ["ac-setpoint", 2], ["pressure-cook", 2], ["peak-shift", 3], ["standby-off", 4], ["ac-setpoint", 5]],
    challenges: ["gujarat-peak-pledge", "cool-24-ahmedabad"],
  },
  desai: {
    user: {
      role: "citizen", displayName: "Desai home (demo)", pincode: "395003", householdSize: 3, homeType: "independent", ownership: "owner", roofAccess: "own",
      equipment: equip({ acCount: 1, washingMachine: true, waterPump: true, inductionStove: true, ev: "two-wheeler", rooftopSolar: true }),
    },
    kwh: [236, 228, 205],
    rate: 6.4,
    extras: { lpgCylinders: 0, carKm: 0, bikeKm: 0, publicKm: 40 },
    done: [["solar-selfuse", 0], ["pump-midday", 0], ["standby-off", 1], ["solar-selfuse", 1], ["ev-night-charge", 2], ["pump-midday", 2], ["solar-selfuse", 3]],
    challenges: ["gujarat-peak-pledge"],
  },
  installer: {
    user: { role: "installer", displayName: "Sunrise Solar Works (demo)", pincode: "390007", householdSize: 1 },
  },
  admin: {
    user: { role: "admin", displayName: "GEDA administrator (demo)", pincode: "382010", householdSize: 1 },
  },
};

export interface DemoBundle {
  user: User;
  snapshots: Snapshot[];
  completions: Completion[];
  challengeIds: string[];
  vendor?: Vendor;
}

/** Builds the account and the history that makes its screens look lived in. Deterministic, so every deploy matches. */
export function buildDemoAccount(key: DemoKey, now: Date): DemoBundle {
  const spec = SPECS[key];
  const id = demoUserId(key);
  const createdAt = now.toISOString();
  const user: User = { ...spec.user, id, isDemo: true, leaderboardOptIn: spec.user.role === "citizen", createdAt };

  const snapshots: Snapshot[] = [];
  if (spec.kwh && spec.extras && spec.rate) {
    const period = istPeriod(now);
    spec.kwh.forEach((kwh, i) => {
      const input = { electricityKwh: kwh, billAmountInr: Math.round(kwh * spec.rate!), ...spec.extras! };
      const p = shiftPeriod(period, i - 2);
      snapshots.push({ ...input, ...calculateFootprint(input), id: `${id}-${p}`, userId: id, period: p, createdAt });
    });
  }

  const today = istDate(now);
  const completions: Completion[] = [];
  const seen = new Set<string>();
  for (const [taskId, ago] of spec.done ?? []) {
    const task = getTask(taskId);
    if (!task) continue;
    const date = addDays(today, -ago);
    const dedupeKey = dedupeKeyFor(task, date);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    completions.push({ id: `${id}-c${completions.length}`, userId: id, taskId, dedupeKey, completedOn: date, points: task.points, impactKg: impactKgOf(task), createdAt });
  }

  let vendor: Vendor | undefined;
  if (key === "installer") {
    vendor = { id: "demo-vendor-sunrise", name: "Sunrise Solar Works (demo)", city: "Vadodara", pincode: "390007", services: ["rooftop-solar", "energy-audit"], status: "approved", isSample: true, ownerUserId: id, createdAt };
  }
  return { user, snapshots, completions, challengeIds: spec.challenges ?? [], vendor };
}
