import { z } from "zod";
import { istPeriod } from "@/lib/dates";
import { VENDOR_SERVICE_IDS } from "@/features/vendors/catalog";

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

const emailField = z.string().trim().toLowerCase().max(120, "Keep the email under 120 characters").email("Enter a valid email address");
const passwordField = z.string().min(8, "Use at least 8 characters for the password").max(128, "Keep the password under 128 characters");

export const onboardingSchema = z
  .object({
    displayName: z.string().trim().min(2, "Enter a name of at least 2 characters").max(40, "Keep the name under 40 characters"),
    pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
    householdSize: z.coerce.number().int("Household size must be a whole number").min(1, "At least 1 person").max(20, "At most 20 people"),
    electricityKwh: footprintSchema.shape.electricityKwh,
    billAmountInr: footprintSchema.shape.billAmountInr,
    /** Optional account. Give both to create one, or neither to stay anonymous. */
    email: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), emailField.optional()),
    password: z.preprocess((v) => (v === "" || v === null ? undefined : v), passwordField.optional()),
  })
  .refine((v) => !v.email || v.password, { message: "Add a password to go with your email", path: ["password"] })
  .refine((v) => !v.password || v.email, { message: "Add your email to go with the password", path: ["email"] });

export const accountSchema = z.object({ email: emailField, password: passwordField });
export const loginSchema = z.object({ email: emailField, password: z.string().min(1, "Enter your password").max(128) });

export const profileSchema = z.object({ leaderboardOptIn: z.boolean() });

export const solarSchema = z.object({
  roofAreaM2: z.coerce.number().min(5, "Roof area must be at least 5 m²").max(5000, "Roof area looks too high"),
  monthlyKwh: z.coerce.number().min(10, "Enter your monthly units").max(10000, "Units look too high"),
  tariffInrPerKwh: z.coerce.number().min(1, "Rate must be at least ₹1").max(30, "Rate looks too high"),
  shade: z.enum(["none", "partial", "heavy"]),
});

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const vendorSchema = z
  .object({
    name: z.string().trim().min(3, "Enter the business name").max(80, "Keep the name under 80 characters"),
    city: z.string().trim().min(2, "Enter the city").max(40, "Keep the city under 40 characters"),
    pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
    services: z.array(z.enum(VENDOR_SERVICE_IDS)).min(1, "Pick at least one service").max(5),
    phone: z.preprocess(blankToUndefined, z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number").optional()),
    website: z.preprocess(blankToUndefined, z.string().trim().max(200).regex(/^https?:\/\/\S+\.\S+$/, "Enter a full web address starting with https://").optional()),
    empanelmentClaim: z.preprocess(blankToUndefined, z.string().trim().max(120, "Keep this under 120 characters").optional()),
  })
  .refine((v) => v.phone || v.website, { message: "Add a phone number or a website so citizens can reach you", path: ["phone"] });

export const vendorReviewSchema = z.object({ decision: z.enum(["approved", "rejected"]) });

export const adminLoginSchema =z.object({ code: z.string().min(1, "Enter the access code").max(200) });

export type FootprintBody = z.infer<typeof footprintSchema>;
export type OnboardingBody = z.infer<typeof onboardingSchema>;
export type VendorBody = z.infer<typeof vendorSchema>;
export type AccountBody = z.infer<typeof accountSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
