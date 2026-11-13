import { EMISSION_FACTORS } from "./emission-factors";

/**
 * "What if I changed one habit?" Each lever uses the same assumption the action catalogue states, so the
 * simulator and the tasks never disagree. These are planning estimates, not measurements of any one home.
 */
export const ASSUMPTIONS = {
  /** Per AC: about 8 hours a day at a 1.2 kW average draw, and roughly 6% saved for each degree warmer. */
  acHoursPerDay: 8,
  acKw: 1.2,
  acSavingPerDegree: 0.06,
  /** A 3 kW geyser. */
  geyserKw: 3,
  /** Chargers, TV, set-top box and printer left on: about 15 W for 20 hours. */
  standbyKwhPerDay: 0.3,
  daysPerMonth: 30,
} as const;

export interface WhatIfInput {
  acCount: number;
  /** Degrees warmer on the AC setpoint, 0 to 4. */
  acDegrees: number;
  hasGeyser: boolean;
  /** Minutes less geyser time per day, 0 to 30. */
  geyserMinutes: number;
  /** Switch standby devices off at the socket. */
  standbyOff: boolean;
}

export interface WhatIfResult {
  kwhPerMonth: number;
  kgPerMonth: number;
  /** Rupees a month at the household's own average rate, or null when no bill amount is known. */
  inrPerMonth: number | null;
  /** Share of last month's units, or null when there is no baseline. */
  pctOfBill: number | null;
}

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

export function whatIf(input: WhatIfInput, baseline?: { kwh: number; billInr?: number }): WhatIfResult {
  const a = ASSUMPTIONS;
  const ac = Math.max(0, input.acCount) * a.acHoursPerDay * a.acKw * a.acSavingPerDegree * Math.max(0, input.acDegrees);
  const geyser = input.hasGeyser ? a.geyserKw * (Math.max(0, input.geyserMinutes) / 60) : 0;
  const standby = input.standbyOff ? a.standbyKwhPerDay : 0;
  const kwhPerMonth = (ac + geyser + standby) * a.daysPerMonth;
  const rate = baseline && baseline.billInr && baseline.kwh > 0 ? baseline.billInr / baseline.kwh : null;
  return {
    kwhPerMonth: round(kwhPerMonth),
    kgPerMonth: round(kwhPerMonth * EMISSION_FACTORS.electricityKgPerKwh),
    inrPerMonth: rate === null ? null : Math.round(kwhPerMonth * rate),
    pctOfBill: baseline && baseline.kwh > 0 ? round((kwhPerMonth / baseline.kwh) * 100) : null,
  };
}
