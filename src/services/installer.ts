import "server-only";
import type { User, Vendor } from "@/types";
import { ApiError } from "@/lib/api";
import { MIN_GROUP_SIZE, regionLabel, regionOf } from "@/lib/calculations/aggregate";
import { getRepository } from "@/lib/store";
import type { VendorBody } from "@/lib/validation";

export async function getListing(user: User): Promise<Vendor | null> {
  return (await getRepository().listVendors()).find((v) => v.ownerUserId === user.id) ?? null;
}

/**
 * Saves the installer's own listing. Any change sends it back to an administrator for review, so approved
 * contact details cannot be swapped for something else afterwards. Demo accounts cannot change anything.
 */
export async function saveListing(user: User, input: VendorBody): Promise<Vendor> {
  if (user.isDemo) throw new ApiError(403, "Demo accounts are view only. Register your own business to manage a listing.");
  const repo = getRepository();
  const existing = await getListing(user);
  const details = { name: input.name, city: input.city, pincode: input.pincode, services: [...new Set(input.services)], phone: input.phone, website: input.website, empanelmentClaim: input.empanelmentClaim };
  if (existing) {
    const updated = await repo.updateVendor(existing.id, details, "pending");
    if (!updated) throw new ApiError(404, "Your listing could not be found.");
    return updated;
  }
  return repo.addVendor({ id: crypto.randomUUID(), ...details, status: "pending", isSample: false, ownerUserId: user.id, createdAt: new Date().toISOString() });
}

export interface Demand {
  areaLabel: string;
  /** False when too few households live in the area to share numbers without identifying anyone. */
  visible: boolean;
  households?: number;
  solarFit?: number;
  avgKwh?: number;
}

/**
 * Area-level demand for rooftop solar, with the same small-group rule as the administrator view: under five
 * households in an area shows no numbers. Individual households are never listed.
 */
export async function getDemand(user: User): Promise<Demand> {
  const repo = getRepository();
  const prefix = regionOf(user.pincode);
  const [users, snapshots] = await Promise.all([repo.listUsers(), repo.listSnapshots()]);
  const households = users.filter((u) => u.role === "citizen" && regionOf(u.pincode) === prefix);
  const areaLabel = regionLabel(prefix);
  if (households.length < MIN_GROUP_SIZE) return { areaLabel, visible: false };

  const latest = new Map<string, number>();
  for (const s of [...snapshots].sort((a, b) => a.period.localeCompare(b.period))) latest.set(s.userId, s.electricityKwh);
  const kwhs = households.map((h) => latest.get(h.id)).filter((n): n is number => n !== undefined);
  // Worth a conversation: high use, a roof they can use, and no panels yet. Unknown equipment counts as "maybe".
  const solarFit = households.filter((h) => (latest.get(h.id) ?? 0) >= 250 && h.roofAccess !== "none" && !h.equipment?.rooftopSolar).length;
  return { areaLabel, visible: true, households: households.length, solarFit, avgKwh: kwhs.length ? Math.round(kwhs.reduce((a, b) => a + b, 0) / kwhs.length) : 0 };
}
