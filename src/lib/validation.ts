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

const vendorFields = {
  name: z.string().trim().min(3, "Enter the business name").max(80, "Keep the name under 80 characters"),
  city: z.string().trim().min(2, "Enter the city").max(40, "Keep the city under 40 characters"),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  services: z.array(z.enum(VENDOR_SERVICE_IDS)).min(1, "Pick at least one service").max(5),
  phone: z.preprocess(blankToUndefined, z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number").optional()),
  website: z.preprocess(blankToUndefined, z.string().trim().max(200).regex(/^https?:\/\/\S+\.\S+$/, "Enter a full web address starting with https://").optional()),
  empanelmentClaim: z.preprocess(blankToUndefined, z.string().trim().max(120, "Keep this under 120 characters").optional()),
};
const needsContact = { message: "Add a phone number or a website so citizens can reach you", path: ["phone"] };

export const vendorSchema = z.object(vendorFields).refine((v) => v.phone || v.website, needsContact);

/** A photo as a small JPEG data URL. The browser shrinks it first; this is the server's own limit and check. */
export const MAX_PROOF_CHARS = 450_000;
export const proofSchema = z.object({
  image: z.string().max(MAX_PROOF_CHARS, "That photo is too large. Try again with a smaller one.").regex(/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+=*$/, "Send the photo as a JPEG image."),
});
export const proofReviewSchema = z.object({ decision: z.enum(["approved", "rejected"]) });

/** A household asking one installer for help. The first message is the request itself. */
export const quoteRequestSchema = z.object({
  vendorId: z.string().trim().min(1).max(80),
  topic: z.enum(VENDOR_SERVICE_IDS),
  message: z.string().trim().min(10, "Say a little more, at least 10 characters").max(1000, "Keep it under 1000 characters"),
});
export const quoteMessageSchema = z.object({ body: z.string().trim().min(1, "Write a message first").max(1000, "Keep it under 1000 characters") });
export const quoteStatusSchema = z.object({ status: z.literal("closed") });
export const vendorVerifySchema = z.object({ note: z.string().trim().min(5, "Say where you checked, at least 5 characters").max(200, "Keep it under 200 characters") });

export const vendorReviewSchema = z.object({ decision: z.enum(["approved", "rejected"]) });

const flag = z.boolean();
export const equipmentSchema = z.object({
  acCount: z.coerce.number().int("Number of ACs must be a whole number").min(0).max(10, "That many ACs looks too high"),
  geyser: flag,
  washingMachine: flag,
  dryer: flag,
  waterPump: flag,
  inductionStove: flag,
  lpg: flag,
  petrolCar: flag,
  petrolTwoWheeler: flag,
  ev: z.enum(["none", "two-wheeler", "car"]),
  rooftopSolar: flag,
  inverterBattery: flag,
});

const homeFields = {
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  householdSize: z.coerce.number().int("Household size must be a whole number").min(1, "At least 1 person").max(20, "At most 20 people"),
  homeType: z.enum(["apartment", "independent", "row-house"], { error: "Pick your type of home" }),
  ownership: z.enum(["owner", "tenant"], { error: "Say whether you own or rent" }),
  roofAccess: z.enum(["none", "shared", "own"], { error: "Pick your roof access" }),
  equipment: equipmentSchema,
};

/** Editing the home later. Same fields as registration, without the account and the bill. */
export const homeProfileSchema = z.object(homeFields);

export const registerCitizenSchema = z.object({
  displayName: z.string().trim().min(2, "Enter a name of at least 2 characters").max(40, "Keep the name under 40 characters"),
  email: emailField,
  password: passwordField,
  ...homeFields,
  electricityKwh: footprintSchema.shape.electricityKwh,
  billAmountInr: footprintSchema.shape.billAmountInr,
});

export const registerInstallerSchema = z.object({ email: emailField, password: passwordField, ...vendorFields }).refine((v) => v.phone || v.website, needsContact);

export const demoLoginSchema = z.object({ key: z.enum(["patel", "desai", "installer", "admin"]) });

const billNumber = (max: number, label: string) => z.coerce.number({ error: `${label} must be a number` }).min(0, `${label} cannot be negative`).max(max, `${label} looks too high`);

/** A scanned bill as confirmed by the user. The server re-checks every number, so nothing here is trusted. */
export const billSchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Pick a valid billing month"),
  consumerNo: z.string().trim().min(8, "Enter the consumer number").max(30, "That consumer number is too long"),
  previousReading: billNumber(100000000, "Previous reading"),
  currentReading: billNumber(100000000, "Present reading"),
  multiplier: z.preprocess((v) => (v === "" || v === null || v === undefined ? 1 : v), billNumber(1000, "Multiplier").refine((n) => n > 0, "Multiplier must be above zero")),
  units: billNumber(100000, "Units"),
  amountInr: z.preprocess((v) => (v === "" || v === null ? undefined : v), billNumber(500000, "Bill amount").optional()),
  source: z.enum(["image", "pdf"]),
});

export const adminLoginSchema =z.object({ code: z.string().min(1, "Enter the access code").max(200) });

export type FootprintBody = z.infer<typeof footprintSchema>;
export type OnboardingBody = z.infer<typeof onboardingSchema>;
export type VendorBody = z.infer<typeof vendorSchema>;
export type BillBody = z.infer<typeof billSchema>;
export type AccountBody = z.infer<typeof accountSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type HomeProfileBody = z.infer<typeof homeProfileSchema>;
export type RegisterCitizenBody = z.infer<typeof registerCitizenSchema>;
export type RegisterInstallerBody = z.infer<typeof registerInstallerSchema>;
