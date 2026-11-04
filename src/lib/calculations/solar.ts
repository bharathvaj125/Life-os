import { EMISSION_FACTORS } from "./emission-factors";

/**
 * Every number below is an editable planning assumption, shown to the user next to the result.
 * Subsidy values follow the PM Surya Ghar residential scheme as last known to us and have NOT been
 * re-verified against pmsuryaghar.gov.in. Confirm eligibility and amounts there before relying on them.
 */
export const SOLAR_ASSUMPTIONS = {
  m2PerKwp: 10,
  usableFractionByShade: { none: 0.6, partial: 0.4, heavy: 0.2 },
  yieldKwhPerKwpYear: { low: 1300, mid: 1450, high: 1600 },
  costInrPerKwp: { low: 55000, high: 70000 },
  subsidy: { firstTwoKwInrPerKw: 30000, thirdKwInr: 18000, capInr: 78000, verified: false },
  minViableKwp: 1,
} as const;

export type ShadeLevel = keyof typeof SOLAR_ASSUMPTIONS.usableFractionByShade;

export interface SolarInput {
  roofAreaM2: number;
  monthlyKwh: number;
  tariffInrPerKwh: number;
  shade: ShadeLevel;
}

export interface Range {
  low: number;
  high: number;
}

export interface SolarEstimate {
  viable: boolean;
  limitedBy: "roof" | "demand";
  capacityKwp: number;
  annualKwh: Range;
  annualSavingsInr: Range;
  costInr: Range;
  subsidyInr: number;
  netCostInr: Range;
  paybackYears: Range;
  co2AvoidedKgPerYear: Range;
  notes: string[];
}

export function subsidyFor(capacityKwp: number): number {
  const s = SOLAR_ASSUMPTIONS.subsidy;
  if (capacityKwp <= 2) return Math.round(capacityKwp * s.firstTwoKwInrPerKw);
  if (capacityKwp <= 3) return Math.round(2 * s.firstTwoKwInrPerKw + (capacityKwp - 2) * s.thirdKwInr);
  return s.capInr;
}

const round = (n: number) => Math.round(n);
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function estimateSolar(input: SolarInput): SolarEstimate {
  const a = SOLAR_ASSUMPTIONS;
  const byRoof = (input.roofAreaM2 * a.usableFractionByShade[input.shade]) / a.m2PerKwp;
  const byDemand = (input.monthlyKwh * 12) / a.yieldKwhPerKwpYear.mid;
  const limitedBy = byRoof <= byDemand ? "roof" : "demand";
  const capacityKwp = Math.floor(Math.min(byRoof, byDemand) * 10) / 10;
  const viable = capacityKwp >= a.minViableKwp;

  const annual = (y: number) => round(capacityKwp * y);
  const annualKwh = { low: annual(a.yieldKwhPerKwpYear.low), high: annual(a.yieldKwhPerKwpYear.high) };
  const annualSavingsInr = { low: round(annualKwh.low * input.tariffInrPerKwh), high: round(annualKwh.high * input.tariffInrPerKwh) };
  const costInr = { low: roundTo(capacityKwp * a.costInrPerKwp.low, 1000), high: roundTo(capacityKwp * a.costInrPerKwp.high, 1000) };
  const subsidyInr = viable ? subsidyFor(capacityKwp) : 0;
  const netCostInr = { low: Math.max(0, costInr.low - subsidyInr), high: Math.max(0, costInr.high - subsidyInr) };
  const years = (cost: number, saving: number) => (saving > 0 ? Math.round((cost / saving) * 10) / 10 : 0);

  const notes = [
    "Roof area is not the same as usable area: shading, tanks, stairwells and structure all reduce it. An installer survey is needed.",
    "Savings assume every generated unit offsets a unit you would have bought at your tariff.",
  ];
  if (!a.subsidy.verified) notes.push("Subsidy amounts are unverified assumptions. Check eligibility and current rates on the official PM Surya Ghar portal.");
  if (!viable) notes.push(`This roof and usage fit under ${a.minViableKwp} kWp, which is usually too small for a standard installation.`);

  return {
    viable,
    limitedBy,
    capacityKwp,
    annualKwh,
    annualSavingsInr,
    costInr,
    subsidyInr,
    netCostInr,
    paybackYears: { low: years(netCostInr.low, annualSavingsInr.high), high: years(netCostInr.high, annualSavingsInr.low) },
    co2AvoidedKgPerYear: { low: round(annualKwh.low * EMISSION_FACTORS.electricityKgPerKwh), high: round(annualKwh.high * EMISSION_FACTORS.electricityKgPerKwh) },
    notes,
  };
}
