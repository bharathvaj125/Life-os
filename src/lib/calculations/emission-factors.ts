/**
 * Emission factors used for every estimate. They are indicative planning values, not audited figures:
 * replace electricityKgPerKwh with the latest release of the CEA CO2 Baseline Database before publishing.
 * The version string is stored with each snapshot so older estimates stay reproducible.
 */
export const EMISSION_FACTORS = {
  version: "indicative-2026.1",
  /** India grid average. Source: CEA CO2 Baseline Database (value is approximate; verify the current release). */
  electricityKgPerKwh: 0.71,
  /** One 14.2 kg LPG cylinder at about 2.98 kg CO2 per kg of LPG. */
  lpgKgPerCylinder: 42.3,
  /** Average petrol car, per vehicle-km. */
  carKgPerKm: 0.17,
  /** Petrol two-wheeler, per vehicle-km. */
  bikeKgPerKm: 0.05,
  /** City bus or metro, per passenger-km. */
  publicKgPerKm: 0.03,
} as const;

export type EmissionFactors = typeof EMISSION_FACTORS;
