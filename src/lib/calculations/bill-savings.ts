import type { Snapshot } from "@/types";
import { shiftPeriod } from "@/lib/dates";
import { EMISSION_FACTORS } from "./emission-factors";

/** Task id stored on bonus completions. They are not in the task catalogue, because they come from bills, not from ticking a task. */
export const BILL_SAVINGS_TASK_ID = "bill-savings";

/** Smallest month-on-month drop that earns a bonus. Smaller changes are normal noise. */
export const MIN_REDUCTION_PCT = 5;
/** A drop bigger than this is more likely a typo or a vacant home than a habit change, so it earns nothing. */
export const MAX_PLAUSIBLE_REDUCTION_PCT = 50;

export interface BillSavingsBonus {
  period: string;
  points: number;
  kwhSaved: number;
  impactKg: number;
  reductionPct: number;
  dedupeKey: string;
}

export const billSavingsKey = (period: string) => `${BILL_SAVINGS_TASK_ID}:${period}`;

const pointsFor = (pct: number) => (pct >= 20 ? 70 : pct >= 10 ? 50 : 30);
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Measures a household's saving from its own consecutive bills. It is worth more than ticking a task because
 * the electricity units are the thing Mission LiFE wants to reduce. The units are still entered by the household,
 * so this is bill-based, not audited. Photographing the bill, or reading it from the DISCOM, is the next step.
 *
 * Rules: the previous month must be the calendar month just before this one, only the current or the previous
 * month can earn, and each month earns at most once (the caller stores the dedupe key).
 */
export function evaluateBillSavings(previous: Snapshot | undefined, current: Snapshot, todayPeriod: string): BillSavingsBonus | null {
  if (!previous || previous.period !== shiftPeriod(current.period, -1)) return null;
  if (current.period > todayPeriod || current.period < shiftPeriod(todayPeriod, -1)) return null;
  if (previous.electricityKwh <= 0) return null;

  const kwhSaved = previous.electricityKwh - current.electricityKwh;
  const reductionPct = (kwhSaved / previous.electricityKwh) * 100;
  if (reductionPct < MIN_REDUCTION_PCT || reductionPct > MAX_PLAUSIBLE_REDUCTION_PCT) return null;

  return {
    period: current.period,
    points: pointsFor(reductionPct),
    kwhSaved: round1(kwhSaved),
    impactKg: round1(kwhSaved * EMISSION_FACTORS.electricityKgPerKwh),
    reductionPct: round1(reductionPct),
    dedupeKey: billSavingsKey(current.period),
  };
}
