import "server-only";
import { randomUUID } from "node:crypto";
import type { User } from "@/types";
import { ApiError } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { getRepository } from "@/lib/store";
import { istPeriod } from "@/lib/dates";
import type { OnboardingBody } from "@/lib/validation";
import { saveSnapshot } from "./footprint";

/** Creates the household and its baseline footprint from the single month of units asked for in onboarding. */
export async function onboard(input: OnboardingBody): Promise<User> {
  // Check the email first so a taken address fails before any household is created.
  if (input.email && (await getRepository().getCredentials(input.email))) throw new ApiError(409, "That email already has an account. Sign in instead.");
  const user: User = {
    id: randomUUID(),
    displayName: input.displayName,
    pincode: input.pincode,
    householdSize: input.householdSize,
    leaderboardOptIn: false,
    isDemo: false,
    createdAt: new Date().toISOString(),
  };
  await getRepository().createUser(user);
  if (input.email && input.password) {
    if (!(await getRepository().setCredentials(user.id, input.email, await hashPassword(input.password)))) throw new ApiError(409, "That email already has an account. Sign in instead.");
    user.email = input.email;
  }
  await saveSnapshot(user.id, { period: istPeriod(), electricityKwh: input.electricityKwh, billAmountInr: input.billAmountInr, lpgCylinders: 0, carKm: 0, bikeKm: 0, publicKm: 0 });
  return user;
}

export async function setLeaderboardOptIn(userId: string, optIn: boolean): Promise<User | null> {
  return getRepository().updateUser(userId, { leaderboardOptIn: optIn });
}
