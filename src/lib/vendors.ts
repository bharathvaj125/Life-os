import type { Vendor, VendorService } from "@/types";

export interface VendorFilter {
  service?: VendorService;
  /** City name or PIN code, matched loosely. */
  place?: string;
}

/** Listings matching the filter. Real listings sort before sample ones, then by name. */
export function filterVendors(vendors: Vendor[], filter: VendorFilter): Vendor[] {
  const place = filter.place?.trim().toLowerCase();
  return vendors
    .filter((v) => !filter.service || v.services.includes(filter.service))
    .filter((v) => !place || v.city.toLowerCase().includes(place) || v.pincode.startsWith(place))
    .sort((a, b) => Number(a.isSample) - Number(b.isSample) || a.name.localeCompare(b.name));
}
