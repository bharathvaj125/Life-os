import "server-only";
import { randomUUID } from "node:crypto";
import type { User, Vendor } from "@/types";
import { ApiError } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { istPeriod } from "@/lib/dates";
import { getRepository } from "@/lib/store";
import type { RegisterCitizenBody, RegisterInstallerBody } from "@/lib/validation";
import { saveSnapshot } from "./footprint";

const EMAIL_TAKEN = "That email already has an account. Sign in instead.";

async function createAccount(user: User, email: string, password: string): Promise<void> {
  const repo = getRepository();
  await repo.createUser(user);
  if (!(await repo.setCredentials(user.id, email, await hashPassword(password)))) throw new ApiError(409, EMAIL_TAKEN);
}

/** A new household with its account, home profile, equipment and first month's footprint. */
export async function registerCitizen(input: RegisterCitizenBody): Promise<User> {
  if (await getRepository().getCredentials(input.email)) throw new ApiError(409, EMAIL_TAKEN);
  const user: User = {
    id: randomUUID(),
    role: "citizen",
    displayName: input.displayName,
    pincode: input.pincode,
    householdSize: input.householdSize,
    homeType: input.homeType,
    ownership: input.ownership,
    roofAccess: input.roofAccess,
    equipment: input.equipment,
    leaderboardOptIn: false,
    isDemo: false,
    createdAt: new Date().toISOString(),
  };
  await createAccount(user, input.email, input.password);
  user.email = input.email;
  await saveSnapshot(user.id, { period: istPeriod(), electricityKwh: input.electricityKwh, billAmountInr: input.billAmountInr, lpgCylinders: 0, carKm: 0, bikeKm: 0, publicKm: 0 });
  return user;
}

/** An installer account plus its vendor listing, which waits for an administrator to approve it. */
export async function registerInstaller(input: RegisterInstallerBody): Promise<User> {
  const repo = getRepository();
  if (await repo.getCredentials(input.email)) throw new ApiError(409, EMAIL_TAKEN);
  const now = new Date().toISOString();
  const user: User = { id: randomUUID(), role: "installer", displayName: input.name, pincode: input.pincode, householdSize: 1, leaderboardOptIn: false, isDemo: false, createdAt: now };
  await createAccount(user, input.email, input.password);
  user.email = input.email;
  const listing: Vendor = {
    id: randomUUID(),
    name: input.name,
    city: input.city,
    pincode: input.pincode,
    services: [...new Set(input.services)],
    phone: input.phone,
    website: input.website,
    empanelmentClaim: input.empanelmentClaim,
    status: "pending",
    isSample: false,
    ownerUserId: user.id,
    createdAt: now,
  };
  await repo.addVendor(listing);
  return user;
}
