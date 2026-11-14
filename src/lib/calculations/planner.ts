import { EMISSION_FACTORS } from "./emission-factors";
import { PEAK_HOURS, windowIndex } from "./schedule";
import { SOLAR_FROM, SOLAR_TO } from "./day";

/**
 * The day planner behind the Cleanest hour page. The household picks the appliances it really runs, says how long
 * and how often, and places each one on the day. Nothing is assumed: an appliance with no start time is left out of
 * every number.
 */

export interface CatalogueItem {
  id: string;
  name: string;
  /** Typical power draw in kilowatts. The user can change it to match their own appliance. */
  kw: number;
  hours: number;
  daysPerWeek: number;
  /** Usually safe to move to another hour of the day. */
  flexible: boolean;
}

/** Typical ratings for shiftable loads in Indian homes. These only pre-fill the form; every value can be edited. */
export const CATALOGUE: CatalogueItem[] = [
  { id: "washer", name: "Washing machine", kw: 0.5, hours: 1, daysPerWeek: 4, flexible: true },
  { id: "dryer", name: "Clothes dryer", kw: 2.5, hours: 1, daysPerWeek: 3, flexible: true },
  { id: "geyser", name: "Water heater (geyser)", kw: 2, hours: 1, daysPerWeek: 7, flexible: true },
  { id: "pump", name: "Water pump", kw: 0.75, hours: 1, daysPerWeek: 7, flexible: true },
  { id: "ev-car", name: "Electric car charger", kw: 3.3, hours: 4, daysPerWeek: 4, flexible: true },
  { id: "ev-scooter", name: "E-scooter charger", kw: 0.8, hours: 4, daysPerWeek: 5, flexible: true },
  { id: "iron", name: "Iron", kw: 1, hours: 1, daysPerWeek: 3, flexible: true },
  { id: "dishwasher", name: "Dishwasher", kw: 1.2, hours: 2, daysPerWeek: 5, flexible: true },
  { id: "ro", name: "Water purifier tank fill", kw: 0.05, hours: 2, daysPerWeek: 7, flexible: true },
  { id: "oven", name: "Oven or OTG", kw: 1.5, hours: 1, daysPerWeek: 2, flexible: true },
];

export interface PlanItem {
  uid: string;
  name: string;
  kw: number;
  /** Whole hours per run. */
  hours: number;
  daysPerWeek: number;
  /** When the household runs it today, as an hour 0-23. Null until the user places it. */
  start: number | null;
  /** The part of the day the appliance is allowed to run in, for the "best time" suggestion. End is exclusive. */
  from: number;
  to: number;
}

const WEEKS_PER_MONTH = 4.33;
const DAYS_PER_MONTH = 30;

export const newPlanItem = (c: Pick<CatalogueItem, "name" | "kw" | "hours" | "daysPerWeek">, uid: string): PlanItem => ({
  uid,
  name: c.name,
  kw: c.kw,
  hours: c.hours,
  daysPerWeek: c.daysPerWeek,
  start: null,
  from: 6,
  to: 23,
});

// ---------- Gujarat residential tariff ----------

export interface Slab {
  /** Cumulative upper limit of the slab in units a month. The last slab uses Infinity. */
  upTo: number;
  rate: number;
}

export interface Tariff {
  slabs: Slab[];
  /** Fuel and power purchase cost adjustment, rupees per unit. DISCOMs change this every quarter. */
  fuelAdjInrPerKwh: number;
  /** Electricity duty as a percentage of the energy charges. */
  dutyPct: number;
}

/**
 * Typical Gujarat residential energy charges for the four DISCOMs (UGVCL, DGVCL, MGVCL, PGVCL): 0-50, 50-100 and
 * 100-250 units, then everything above 250. The fuel adjustment moves every quarter and Torrent Power areas
 * (Ahmedabad, Gandhinagar, Surat) differ a little, so these are planning values and the user can edit each one.
 * The fixed monthly charge is left out on purpose: moving an appliance to another hour never changes it.
 */
export const GUJARAT_TARIFF: Tariff = {
  slabs: [
    { upTo: 50, rate: 3.05 },
    { upTo: 100, rate: 3.5 },
    { upTo: 250, rate: 4.15 },
    { upTo: Infinity, rate: 5.2 },
  ],
  fuelAdjInrPerKwh: 2.35,
  dutyPct: 15,
};

/** Energy bill in rupees for a month's units, before the fixed charge. */
export function energyBill(units: number, t: Tariff): number {
  const u = Math.max(0, units);
  let lower = 0;
  let sum = 0;
  for (const s of t.slabs) {
    const inSlab = Math.min(u, s.upTo) - lower;
    if (inSlab > 0) sum += inSlab * s.rate;
    lower = s.upTo;
    if (u <= s.upTo) break;
  }
  sum += u * t.fuelAdjInrPerKwh;
  return sum * (1 + t.dutyPct / 100);
}

/** What an appliance's own units add to a bill whose total is `monthlyUnits`. They are the last units bought, so they cost the top slab rate. */
export function applianceCost(kwhPerMonth: number, monthlyUnits: number, t: Tariff): number {
  const total = Math.max(monthlyUnits, kwhPerMonth);
  return energyBill(total, t) - energyBill(total - kwhPerMonth, t);
}

// ---------- Time-of-day pricing (optional) ----------

export interface TimeOfDay {
  /** Extra rupees per unit used in the 6-10 PM peak. Zero for an ordinary Gujarat home meter. */
  peakExtraInr: number;
  /** Rupees per unit knocked off in the 10 AM-3 PM solar hours. */
  solarRebateInr: number;
}

export const NO_TOD: TimeOfDay = { peakExtraInr: 0, solarRebateInr: 0 };

const inSolar = (h: number) => h >= SOLAR_FROM && h < SOLAR_TO;
const hoursOf = (start: number, hours: number) => Array.from({ length: hours }, (_, i) => (start + i) % 24);

/** Rupees per run added (or taken off) by time-of-day pricing for running at `start`. */
export function todPerRun(kw: number, start: number, hours: number, tod: TimeOfDay): number {
  let adj = 0;
  for (const h of hoursOf(start, hours)) {
    if (PEAK_HOURS.includes(h)) adj += tod.peakExtraInr;
    else if (inSolar(h)) adj -= tod.solarRebateInr;
  }
  return kw * adj;
}

// ---------- Planning ----------

/** The lowest-carbon start that keeps the whole run inside the allowed part of the day. Null if it cannot fit. */
export function bestStartWithin(item: Pick<PlanItem, "hours" | "from" | "to">): number | null {
  let best: number | null = null;
  for (let s = item.from; s + item.hours <= item.to; s++) {
    if (best === null || windowIndex(s, item.hours) < windowIndex(best, item.hours) - 1e-9) best = s;
  }
  return best;
}

export interface ItemPlan {
  runsPerMonth: number;
  kwhPerMonth: number;
  /** Rupees for the appliance's own units at the household's slab. */
  costPerMonth: number;
  kgNow: number;
  kgBest: number;
  best: number | null;
  /** Positive when the best time is cheaper or cleaner than the current one. */
  saveKgPerMonth: number;
  saveInrPerMonth: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function planItem(item: PlanItem, monthlyUnits: number, tariff: Tariff, tod: TimeOfDay): ItemPlan | null {
  if (item.start === null) return null;
  const runsPerMonth = item.daysPerWeek * WEEKS_PER_MONTH;
  const kwhPerMonth = item.kw * item.hours * runsPerMonth;
  const best = bestStartWithin(item);
  const kg = (start: number) => kwhPerMonth * EMISSION_FACTORS.electricityKgPerKwh * windowIndex(start, item.hours);
  const tod$ = (start: number) => todPerRun(item.kw, start, item.hours, tod) * runsPerMonth;
  const kgNow = kg(item.start);
  const kgBest = best === null ? kgNow : Math.min(kgNow, kg(best));
  const todNow = tod$(item.start);
  const todBest = best === null ? todNow : Math.min(todNow, tod$(best));
  const saveKgPerMonth = Math.max(0, kgNow - kgBest);
  const saveInrPerMonth = Math.max(0, todNow - todBest);
  return {
    runsPerMonth,
    kwhPerMonth: round1(kwhPerMonth),
    costPerMonth: Math.round(applianceCost(kwhPerMonth, monthlyUnits, tariff) + todNow),
    kgNow: round1(kgNow),
    kgBest: round1(kgBest),
    best,
    saveKgPerMonth: round1(saveKgPerMonth),
    saveInrPerMonth: Math.round(saveInrPerMonth),
  };
}

export interface PlanTotals {
  placed: number;
  kwhPerMonth: number;
  costPerMonth: number;
  kgNow: number;
  kgBest: number;
  saveKgPerMonth: number;
  saveInrPerMonth: number;
  saveKgPerDay: number;
  saveInrPerDay: number;
}

export function planTotals(items: PlanItem[], monthlyUnits: number, tariff: Tariff, tod: TimeOfDay): PlanTotals {
  const plans = items.map((i) => planItem(i, monthlyUnits, tariff, tod)).filter((p): p is ItemPlan => p !== null);
  const sum = (f: (p: ItemPlan) => number) => plans.reduce((s, p) => s + f(p), 0);
  const saveKgPerMonth = sum((p) => p.saveKgPerMonth);
  const saveInrPerMonth = sum((p) => p.saveInrPerMonth);
  return {
    placed: plans.length,
    kwhPerMonth: round1(sum((p) => p.kwhPerMonth)),
    costPerMonth: sum((p) => p.costPerMonth),
    kgNow: round1(sum((p) => p.kgNow)),
    kgBest: round1(sum((p) => p.kgBest)),
    saveKgPerMonth: round1(saveKgPerMonth),
    saveInrPerMonth,
    saveKgPerDay: Math.round((saveKgPerMonth / DAYS_PER_MONTH) * 100) / 100,
    saveInrPerDay: Math.round((saveInrPerMonth / DAYS_PER_MONTH) * 10) / 10,
  };
}
