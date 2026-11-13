/**
 * A rough floor for monthly electricity use. A home cannot realistically run on almost nothing: a fan, lights
 * and a fridge alone use more. A month below this is not rejected, only flagged as unusually low, because it
 * can be real (a holiday, a vacant home) and the household may not be cheating.
 */
export const MIN_KWH_PER_PERSON = 20;

export interface Plausibility {
  /** False when the units are below the floor for this household size. */
  plausible: boolean;
  minKwh: number;
}

export function plausibilityOf(electricityKwh: number, householdSize: number): Plausibility {
  const minKwh = MIN_KWH_PER_PERSON * Math.max(1, householdSize);
  return { plausible: electricityKwh >= minKwh, minKwh };
}
