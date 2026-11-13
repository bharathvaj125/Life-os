import "server-only";
import type { Vendor, VendorStatus } from "@/types";
import { ApiError } from "@/lib/api";
import { getRepository } from "@/lib/store";
import { filterVendors, type VendorFilter } from "@/lib/vendors";

export async function listApprovedVendors(filter: VendorFilter = {}): Promise<Vendor[]> {
  const all = await getRepository().listVendors();
  return filterVendors(all.filter((v) => v.status === "approved"), filter);
}

export async function listPendingVendors(): Promise<Vendor[]> {
  const all = await getRepository().listVendors();
  return all.filter((v) => v.status === "pending").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function listAllVendors(): Promise<Vendor[]> {
  return (await getRepository().listVendors()).sort((a, b) => a.name.localeCompare(b.name));
}

/** Records that an administrator found this business on an official empanelment list. The check itself is done by a person on the official site. */
export async function verifyVendor(id: string, note: string, now: Date = new Date()): Promise<Vendor> {
  const vendor = await getRepository().setVendorVerification(id, { verifiedOn: now.toISOString().slice(0, 10), verifiedNote: note });
  if (!vendor) throw new ApiError(404, "That listing no longer exists.");
  return vendor;
}

export async function clearVendorVerification(id: string): Promise<Vendor> {
  const vendor = await getRepository().setVendorVerification(id, null);
  if (!vendor) throw new ApiError(404, "That listing no longer exists.");
  return vendor;
}

export async function reviewVendor(id: string, decision: Extract<VendorStatus, "approved" | "rejected">): Promise<Vendor> {
  const vendor = await getRepository().setVendorStatus(id, decision);
  if (!vendor) throw new ApiError(404, "That listing no longer exists.");
  return vendor;
}
