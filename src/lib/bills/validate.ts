import type { BillFields } from "./parse";

/**
 * Checks that a bill's numbers are consistent. This proves the bill is internally consistent and plausible,
 * not that it is genuine: only the distribution company can confirm that. The badge is worded accordingly.
 */
export interface BillCheck {
  /** "scanned": every check passed. "review": something needs the user's attention before it counts as a scanned bill. */
  status: "scanned" | "review";
  reasons: string[];
  /** The meter difference times the multiplier, when both readings are present. */
  computedUnits?: number;
}

export const MIN_UNITS = 1;
export const MAX_UNITS = 10000;
/** How far apart printed and calculated units may be. Bills round readings. */
export const UNIT_TOLERANCE = 1;
export const MAX_BILL_AGE_MONTHS = 24;

const periodOf = (now: Date) => {
  const ist = new Date(now.getTime() + 5.5 * 3600000);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, "0")}`;
};
const monthIndex = (period: string) => Number(period.slice(0, 4)) * 12 + Number(period.slice(5, 7)) - 1;

export function normaliseConsumerNo(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function validateBill(f: BillFields, now: Date = new Date()): BillCheck {
  const reasons: string[] = [];

  const consumer = f.consumerNo ? normaliseConsumerNo(f.consumerNo) : "";
  if (consumer.length < 8 || consumer.length > 13) reasons.push("The consumer number should be 8 to 13 digits.");

  if (!f.month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(f.month)) {
    reasons.push("The billing month is missing or not readable.");
  } else {
    const current = periodOf(now);
    if (f.month > current) reasons.push("That billing month is in the future.");
    else if (monthIndex(current) - monthIndex(f.month) > MAX_BILL_AGE_MONTHS) reasons.push("That bill is more than two years old.");
  }

  if (f.units === undefined || !Number.isFinite(f.units) || f.units < MIN_UNITS || f.units > MAX_UNITS) {
    reasons.push(`The units should be between ${MIN_UNITS} and ${MAX_UNITS}.`);
  }

  let computedUnits: number | undefined;
  if (f.previousReading === undefined || f.currentReading === undefined) {
    reasons.push("Both meter readings are needed to double-check the units.");
  } else if (f.currentReading < f.previousReading) {
    reasons.push("The present reading is lower than the previous reading.");
  } else {
    computedUnits = Math.round((f.currentReading - f.previousReading) * (f.multiplier ?? 1) * 100) / 100;
    if (f.units !== undefined && Math.abs(computedUnits - f.units) > UNIT_TOLERANCE) {
      reasons.push(`The readings give ${computedUnits} units but the bill says ${f.units}, so they do not add up.`);
    }
  }

  return { status: reasons.length === 0 ? "scanned" : "review", reasons, computedUnits };
}
