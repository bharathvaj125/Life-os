import "server-only";
import { randomUUID } from "node:crypto";
import type { User } from "@/types";
import { getRepository } from "@/lib/store";
import { istPeriod } from "@/lib/dates";
import type { OnboardingBody } from "@/lib/validation";
import { saveSnapshot } from "./footprint";

/** Creates the household and its baseline footprint from the single month of units asked for in onboarding. */
export async function onboard(input: OnboardingBody): Promise<User> {
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
  await saveSnapshot(user.id, { period: istPeriod(), electricityKwh: input.electricityKwh, billAmountInr: input.billAmountInr, lpgCylinders: 0, carKm: 0, bikeKm: 0, publicKm: 0 });
  return user;
}

export async function setLeaderboardOptIn(userId: string, optIn: boolean): Promise<User | null> {
  return getRepository().updateUser(userId, { leaderboardOptIn: optIn });
}
