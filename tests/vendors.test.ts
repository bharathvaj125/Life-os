import { describe, expect, it } from "vitest";
import { filterVendors } from "@/lib/vendors";
import { vendorSchema, vendorReviewSchema } from "@/lib/validation";
import { buildSampleVendors } from "@/lib/store/seed";
import type { Vendor } from "@/types";

const vendor = (over: Partial<Vendor>): Vendor => ({
  id: "v", name: "Vendor", city: "Ahmedabad", pincode: "380015", services: ["rooftop-solar"], status: "approved", isSample: false, createdAt: "", ...over,
});

describe("vendor filtering", () => {
  const list = [
    vendor({ id: "a", name: "Beta Solar", city: "Ahmedabad", pincode: "380015" }),
    vendor({ id: "b", name: "Alpha EV", city: "Surat", pincode: "395003", services: ["ev-charging"] }),
    vendor({ id: "c", name: "Sample Co", city: "Ahmedabad", isSample: true }),
  ];
  it("filters by service", () => {
    expect(filterVendors(list, { service: "ev-charging" }).map((v) => v.id)).toEqual(["b"]);
  });
  it("matches a city name loosely and a PIN prefix", () => {
    expect(filterVendors(list, { place: "ahmed" }).map((v) => v.id)).toEqual(["a", "c"]);
    expect(filterVendors(list, { place: "395" }).map((v) => v.id)).toEqual(["b"]);
  });
  it("lists real vendors before samples, then by name", () => {
    expect(filterVendors(list, {}).map((v) => v.id)).toEqual(["b", "a", "c"]);
  });
  it("returns everything when nothing is filtered", () => {
    expect(filterVendors(list, { place: "  " })).toHaveLength(3);
  });
});

describe("vendor submission rules", () => {
  const ok = { name: "Sunrise Solar", city: "Surat", pincode: "395003", services: ["rooftop-solar"], phone: "9876543210" };
  it("accepts a complete submission and turns blank optional fields into undefined", () => {
    const parsed = vendorSchema.parse({ ...ok, website: "", empanelmentClaim: " " });
    expect(parsed.website).toBeUndefined();
    expect(parsed.empanelmentClaim).toBeUndefined();
  });
  it("needs a phone number or a website", () => {
    expect(vendorSchema.safeParse({ ...ok, phone: "" }).success).toBe(false);
    expect(vendorSchema.safeParse({ ...ok, phone: "", website: "https://example.com" }).success).toBe(true);
  });
  it("rejects bad PIN codes, phone numbers, services and links", () => {
    expect(vendorSchema.safeParse({ ...ok, pincode: "012345" }).success).toBe(false);
    expect(vendorSchema.safeParse({ ...ok, phone: "12345" }).success).toBe(false);
    expect(vendorSchema.safeParse({ ...ok, services: [] }).success).toBe(false);
    expect(vendorSchema.safeParse({ ...ok, services: ["magic"] }).success).toBe(false);
    expect(vendorSchema.safeParse({ ...ok, website: "javascript:alert(1)" }).success).toBe(false);
  });
  it("only allows approve or reject as a review decision", () => {
    expect(vendorReviewSchema.safeParse({ decision: "approved" }).success).toBe(true);
    expect(vendorReviewSchema.safeParse({ decision: "pending" }).success).toBe(false);
  });
});

describe("sample vendors", () => {
  it("are all labelled as samples, approved, and carry no contact details", () => {
    const samples = buildSampleVendors("2026-11-13T00:00:00.000Z");
    expect(samples.length).toBeGreaterThan(0);
    for (const v of samples) {
      expect(v.isSample).toBe(true);
      expect(v.status).toBe("approved");
      expect(v.name).toMatch(/\(sample\)$/);
      expect(v.phone).toBeUndefined();
      expect(v.website).toBeUndefined();
    }
  });
});
