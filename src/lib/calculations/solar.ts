import type { SolarInput, SolarEstimate } from "../../types/domain";

// Explicit illustrative engineering assumptions, NOT verified regional yields.
// No live irradiance, shading, structural, tariff, subsidy, or vendor claims.
export function estimateSolar(input: SolarInput): SolarEstimate {
  if (!Number.isFinite(input.roofAreaM2) || input.roofAreaM2 < 1 || input.roofAreaM2 > 10_000 || !Number.isFinite(input.monthlyElectricityKwh) || input.monthlyElectricityKwh < 0 || input.monthlyElectricityKwh > 100_000) throw new RangeError("Invalid solar input.");
  const roofLimitedKwp = input.roofAreaM2 / 10;
  const demandLimitedKwp = input.monthlyElectricityKwh * 12 / 1200;
  const capacityKwp = Math.min(roofLimitedKwp, demandLimitedKwp);
  return { capacityKwp, annualGenerationKwh: capacityKwp * 1200, evidence: {
    formulaVersion: "solar-planning-v1",
    sourceUrl: "https://github.com/bharathvaj125/Life-os/blob/feat/backend-foundation/docs/CALCULATION_METHODS.md",
    sourcePeriod: "Illustrative planning scenario; not measured regional data",
    isEstimate: true,
    assumptions: ["10 m² of usable roof per kWp; roof area must exclude unusable space.", "Illustrative annual yield: 1200 kWh per kWp, not a location-specific forecast.", "Capacity is limited by both roof area and supplied annual electricity demand.", "No structural, shading, orientation, export-credit, tariff, subsidy, or financial assessment. Obtain a qualified site survey before installation."],
  } };
}
