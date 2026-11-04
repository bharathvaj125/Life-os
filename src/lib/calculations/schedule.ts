import { EMISSION_FACTORS } from "./emission-factors";

/**
 * Relative grid emission intensity for each hour of the day, where 1.0 is the daily average.
 * ILLUSTRATIVE MODEL, not live data: it assumes solar generation lowers intensity around midday and
 * fossil peaking plants raise it in the evening. Replace with a measured hourly series (for example
 * from the grid operator) when one is available.
 */
export const INTENSITY_INDEX: readonly number[] = [0.98, 0.97, 0.96, 0.96, 0.97, 1.0, 1.02, 1.0, 0.95, 0.9, 0.86, 0.84, 0.84, 0.85, 0.87, 0.9, 0.96, 1.05, 1.12, 1.14, 1.12, 1.08, 1.03, 1.0];

export const PEAK_HOURS = [18, 19, 20, 21];

export interface Appliance {
  id: string;
  name: string;
  kw: number;
  hours: number;
  runsPerWeek: number;
}

export const DEFAULT_APPLIANCES: Appliance[] = [
  { id: "washer", name: "Washing machine", kw: 0.5, hours: 1, runsPerWeek: 4 },
  { id: "geyser", name: "Water heater (geyser)", kw: 2, hours: 1, runsPerWeek: 7 },
  { id: "ev", name: "EV or scooter charger", kw: 3.3, hours: 3, runsPerWeek: 5 },
  { id: "iron", name: "Iron", kw: 1, hours: 1, runsPerWeek: 3 },
];

const hourAt = (start: number, offset: number) => (start + offset) % 24;

/** Mean intensity index across the hours an appliance runs, wrapping past midnight. */
export function windowIndex(start: number, hours: number): number {
  let sum = 0;
  for (let i = 0; i < hours; i++) sum += INTENSITY_INDEX[hourAt(start, i)];
  return sum / hours;
}

export function touchesPeak(start: number, hours: number): boolean {
  return Array.from({ length: hours }, (_, i) => hourAt(start, i)).some((h) => PEAK_HOURS.includes(h));
}

export function bestStart(a: Appliance): number {
  let best = 0;
  for (let h = 1; h < 24; h++) if (windowIndex(h, a.hours) < windowIndex(best, a.hours)) best = h;
  return best;
}

export interface RunImpact {
  kwhPerMonth: number;
  kgPerMonth: number;
  /** Extra rupees per month if the user entered a peak surcharge and a rate, else undefined. */
  peakSurchargeInrPerMonth?: number;
}

const WEEKS_PER_MONTH = 4.33;

export function scheduleImpact(a: Appliance, start: number, opts: { inrPerKwh?: number; peakSurchargePct?: number } = {}): RunImpact {
  const kwhPerRun = a.kw * a.hours;
  const runs = a.runsPerWeek * WEEKS_PER_MONTH;
  const kwhPerMonth = kwhPerRun * runs;
  const kgPerMonth = kwhPerMonth * EMISSION_FACTORS.electricityKgPerKwh * windowIndex(start, a.hours);
  const peakHours = Array.from({ length: a.hours }, (_, i) => hourAt(start, i)).filter((h) => PEAK_HOURS.includes(h)).length;
  const peakSurchargeInrPerMonth = opts.inrPerKwh && opts.peakSurchargePct ? a.kw * peakHours * runs * opts.inrPerKwh * (opts.peakSurchargePct / 100) : undefined;
  return { kwhPerMonth: Math.round(kwhPerMonth * 10) / 10, kgPerMonth: Math.round(kgPerMonth * 10) / 10, peakSurchargeInrPerMonth: peakSurchargeInrPerMonth === undefined ? undefined : Math.round(peakSurchargeInrPerMonth) };
}

export const hourLabel = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? " AM" : " PM"}`;
