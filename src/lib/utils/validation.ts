import type { CredentialsInput, ProfileInput } from "../../types/api";

export class InputError extends Error {
  readonly fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>) { super("Check the highlighted fields."); this.fieldErrors = fieldErrors; }
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError({ body: "Expected a JSON object." });
  return value as Record<string, unknown>;
}
function knownKeys(value: Record<string, unknown>, allowed: string[], errors: Record<string, string>) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) errors[key] = "Unknown field.";
}
export function parseCredentials(value: unknown, mode: "signup" | "signin"): CredentialsInput {
  const input = record(value);
  const errors: Record<string, string> = {};
  knownKeys(input, ["email", "password"], errors);
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  // Passwords are never trimmed or otherwise modified. Existing accounts may
  // have an older policy; apply the new minimum only during registration.
  if (password.length < (mode === "signup" ? 12 : 1) || password.length > 128) errors.password = mode === "signup" ? "Use 12–128 characters." : "Enter your password (maximum 128 characters).";
  if (Object.keys(errors).length) throw new InputError(errors);
  return { email, password };
}
export function parseProfile(value: unknown): ProfileInput {
  const input = record(value);
  const errors: Record<string, string> = {};
  knownKeys(input, ["displayName", "state", "district", "householdSize", "communityOptIn"], errors);
  function text(key: string, min: number, max: number) {
    const v = typeof input[key] === "string" ? input[key].trim() : "";
    if ([...v].length < min || [...v].length > max) errors[key] = `Use ${min}–${max} characters.`;
    return v;
  }
  const displayName = text("displayName", 2, 60);
  const state = text("state", 2, 80);
  const district = input.district === null ? null : text("district", 2, 80);
  if (!Number.isInteger(input.householdSize) || (input.householdSize as number) < 1 || (input.householdSize as number) > 50) errors.householdSize = "Enter a whole number from 1 to 50.";
  if (typeof input.communityOptIn !== "boolean") errors.communityOptIn = "Choose whether to opt in.";
  if (Object.keys(errors).length) throw new InputError(errors);
  return { displayName, state, district, householdSize: input.householdSize as number, communityOptIn: input.communityOptIn as boolean };
}
