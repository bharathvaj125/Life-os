import { z } from "zod";
import { istPeriod } from "@/lib/dates";

const nonNegative = (max: number, label: string) => z.coerce.number({ error: `${label} must be a number` }).min(0, `${label} cannot be negative`).max(max, `${label} looks too high`);

export const footprintSchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Pick a valid month").refine((p) => p <= istPeriod(), "That month is in the future"),
  electricityKwh: nonNegative(10000, "Electricity units").refine((n) => n > 0, "Enter the units from your bill"),
  billAmountInr: z.preprocess((v) => (v === "" || v === null ? undefined : v), nonNegative(500000, "Bill amount").optional()),
  lpgCylinders: nonNegative(10, "LPG cylinders").default(0),
  carKm: nonNegative(10000, "Car km").default(0),
  bikeKm: nonNegative(10000, "Two-wheeler km").default(0),
  publicKm: nonNegative(10000, "Public transport km").default(0),
});

export const onboardingSchema = z.object({
  displayName: z.string().trim().min(2, "Enter a name of at least 2 characters").max(40, "Keep the name under 40 characters"),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  householdSize: z.coerce.number().int("Household size must be a whole number").min(1, "At least 1 person").max(20, "At most 20 people"),
  electricityKwh: footprintSchema.shape.electricityKwh,
  billAmountInr: footprintSchema.shape.billAmountInr,
});

export const profileSchema = z.object({ leaderboardOptIn: z.boolean() });

export const solarSchema = z.object({
  roofAreaM2: z.coerce.number().min(5, "Roof area must be at least 5 m²").max(5000, "Roof area looks too high"),
  monthlyKwh: z.coerce.number().min(10, "Enter your monthly units").max(10000, "Units look too high"),
  tariffInrPerKwh: z.coerce.number().min(1, "Rate must be at least ₹1").max(30, "Rate looks too high"),
  shade: z.enum(["none", "partial", "heavy"]),
});

export const adminLoginSchema = z.object({ code: z.string().min(1, "Enter the access code").max(200) });

export type FootprintBody = z.infer<typeof footprintSchema>;
export type OnboardingBody = z.infer<typeof onboardingSchema>;
