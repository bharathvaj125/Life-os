import type { FootprintInput } from "../../types/domain";

export function calculateFootprint(input: FootprintInput, factor: number | null) {
  const periodDays = (Date.parse(input.periodEnd) - Date.parse(input.periodStart)) / 86_400_000 + 1;
  if (!Number.isInteger(periodDays) || periodDays < 1 || periodDays > 366 || !Number.isFinite(input.electricityKwh) || input.electricityKwh < 0 || input.electricityKwh > 100_000 || (factor !== null && (!Number.isFinite(factor) || factor <= 0 || factor > 5))) throw new RangeError("Invalid footprint calculation input.");
  return { periodDays, electricityKwhPerDay: input.electricityKwh / periodDays, emissionsKgCO2e: factor === null ? null : input.electricityKwh * factor, emissionsKgCO2ePerDay: factor === null ? null : input.electricityKwh * factor / periodDays };
}
export function reductionPercent(baselineKwhPerDay: number, latestKwhPerDay: number): number | null {
  return baselineKwhPerDay > 0 ? (baselineKwhPerDay - latestKwhPerDay) / baselineKwhPerDay * 100 : null;
}
