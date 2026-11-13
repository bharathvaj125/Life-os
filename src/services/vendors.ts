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

export async function reviewVendor(id: string, decision: Extract<VendorStatus, "approved" | "rejected">): Promise<Vendor> {
  const vendor = await getRepository().setVendorStatus(id, decision);
  if (!vendor) throw new ApiError(404, "That listing no longer exists.");
  return vendor;
}
