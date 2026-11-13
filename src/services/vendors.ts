import "server-only";
import { randomUUID } from "node:crypto";
import type { Vendor, VendorStatus } from "@/types";
import { ApiError } from "@/lib/api";
import { getRepository } from "@/lib/store";
import { filterVendors, type VendorFilter } from "@/lib/vendors";
import type { VendorBody } from "@/lib/validation";

/** The most pending requests we hold at once, so the review queue cannot be flooded. */
const MAX_PENDING = 100;

export async function listApprovedVendors(filter: VendorFilter = {}): Promise<Vendor[]> {
  const all = await getRepository().listVendors();
  return filterVendors(all.filter((v) => v.status === "approved"), filter);
}

export async function listPendingVendors(): Promise<Vendor[]> {
  const all = await getRepository().listVendors();
  return all.filter((v) => v.status === "pending").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Public submission. It is stored as pending and only appears in the directory after an administrator approves it. */
export async function submitVendor(input: VendorBody): Promise<Vendor> {
  const repo = getRepository();
  const existing = await repo.listVendors();
  if (existing.filter((v) => v.status === "pending").length >= MAX_PENDING) throw new ApiError(429, "We have a lot of requests waiting for review. Please try again later.");
  const name = input.name.toLowerCase();
  if (existing.some((v) => v.status !== "rejected" && v.name.toLowerCase() === name && v.pincode === input.pincode)) throw new ApiError(409, "This business is already listed or waiting for review.");

  const vendor: Vendor = {
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
    createdAt: new Date().toISOString(),
  };
  return repo.addVendor(vendor);
}

export async function reviewVendor(id: string, decision: Extract<VendorStatus, "approved" | "rejected">): Promise<Vendor> {
  const vendor = await getRepository().setVendorStatus(id, decision);
  if (!vendor) throw new ApiError(404, "That listing no longer exists.");
  return vendor;
}
