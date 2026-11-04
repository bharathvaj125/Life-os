import type { FootprintBreakdown, FootprintInput, Snapshot } from "@/types";
import { EMISSION_FACTORS, type EmissionFactors } from "./emission-factors";

const round1 = (n: number) => Math.round(n * 10) / 10;

export function calculateFootprint(input: FootprintInput, factors: EmissionFactors = EMISSION_FACTORS): FootprintBreakdown {
  const electricity = input.electricityKwh * factors.electricityKgPerKwh;
  const commute = input.carKm * factors.carKgPerKm + input.bikeKm * factors.bikeKgPerKm + input.publicKm * factors.publicKgPerKm;
  const lpg = input.lpgCylinders * factors.lpgKgPerCylinder;
  return {
    electricityKg: round1(electricity),
    commuteKg: round1(commute),
    lpgKg: round1(lpg),
    totalKg: round1(electricity + commute + lpg),
    factorVersion: factors.version,
  };
}

export interface Trend {
  latest?: Snapshot;
  previous?: Snapshot;
  /** Percentage change in total kg CO2e versus the previous period, undefined with fewer than two snapshots. */
  changePct?: number;
  /** Total kg CO2e of the earliest snapshot, the user's baseline. */
  baselineKg?: number;
}

/** Snapshots must be sorted by period ascending. */
export function trendOf(snapshots: Snapshot[]): Trend {
  const latest = snapshots.at(-1);
  const previous = snapshots.at(-2);
  const changePct = latest && previous && previous.totalKg > 0 ? round1(((latest.totalKg - previous.totalKg) / previous.totalKg) * 100) : undefined;
  return { latest, previous, changePct, baselineKg: snapshots[0]?.totalKg };
}
