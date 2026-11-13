import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { distanceKm, polygonAreaM2 } from "@/lib/maps/geo";
import { generateNudges } from "@/lib/calculations/nudges";
import { quoteMessageSchema, quoteRequestSchema, vendorVerifySchema } from "@/lib/validation";
import { buildPublicDirectory } from "@/lib/store/seed";
import { EMPTY_EQUIPMENT } from "@/features/equipment/catalog";
import type { QuoteMessage, QuoteRequest, Snapshot } from "@/types";

describe("distance", () => {
  it("is zero for the same point and about 440 km from Ahmedabad to Mumbai", () => {
    expect(distanceKm([23.03, 72.58], [23.03, 72.58])).toBe(0);
    const d = distanceKm([23.0225, 72.5714], [19.076, 72.8777]);
    expect(d).toBeGreaterThan(430);
    expect(d).toBeLessThan(450);
  });
  it("is symmetric", () => {
    expect(distanceKm([22.3, 70.8], [21.17, 72.83])).toBeCloseTo(distanceKm([21.17, 72.83], [22.3, 70.8]), 6);
  });
});

describe("roof area from corners", () => {
  // A 10 m by 8 m rectangle near Ahmedabad: 1 degree of latitude is about 111,195 m, longitude shrinks with cos(latitude).
  const lat = 23.03;
  const dLat = 8 / 111_195;
  const dLon = 10 / (111_195 * Math.cos((lat * Math.PI) / 180));
  const rect: [number, number][] = [[lat, 72.58], [lat, 72.58 + dLon], [lat + dLat, 72.58 + dLon], [lat + dLat, 72.58]];
  it("measures a 10 m by 8 m roof as about 80 m2", () => {
    expect(polygonAreaM2(rect)).toBeGreaterThan(78);
    expect(polygonAreaM2(rect)).toBeLessThan(82);
  });
  it("does not depend on the order the corners were clicked", () => {
    expect(polygonAreaM2([...rect].reverse())).toBeCloseTo(polygonAreaM2(rect), 3);
  });
  it("needs at least three corners", () => {
    expect(polygonAreaM2([])).toBe(0);
    expect(polygonAreaM2(rect.slice(0, 2))).toBe(0);
  });
});

describe("tips lead to points", () => {
  const snap = (kwh: number, period: string): Snapshot => ({ id: period, userId: "u", period, electricityKwh: kwh, billAmountInr: 1800, lpgCylinders: 1, carKm: 0, bikeKm: 0, publicKm: 0, electricityKg: 0, commuteKg: 0, lpgKg: 0, totalKg: 0, factorVersion: "x", createdAt: "2026-11-01T00:00:00.000Z" });
  const nudges = generateNudges({ householdSize: 3, snapshots: [snap(200, "2026-10"), snap(240, "2026-11")], now: new Date("2026-11-14T07:00:00Z"), equipment: { ...EMPTY_EQUIPMENT, geyser: true, lpg: true }, roofAccess: "own" });
  it("shows the task and points for a tip that has one", () => {
    const geyser = nudges.find((n) => n.id === "geyser-timer");
    expect(geyser?.reward).toEqual({ taskId: "geyser-short", title: expect.any(String), points: 10 });
  });
  it("marks a tip with no task as advice only", () => {
    expect(nudges.find((n) => n.id === "usage-up")?.reward).toBeUndefined();
  });
  it("never points at a task the home cannot do", () => {
    const ev = nudges.find((n) => n.id === "ev-night");
    expect(ev).toBeUndefined();
  });
});

describe("quote validation", () => {
  it("needs a service and a real message", () => {
    expect(quoteRequestSchema.safeParse({ vendorId: "v1", topic: "rooftop-solar", message: "Please quote for 3 kW." }).success).toBe(true);
    expect(quoteRequestSchema.safeParse({ vendorId: "v1", topic: "rooftop-solar", message: "hi" }).success).toBe(false);
    expect(quoteRequestSchema.safeParse({ vendorId: "v1", topic: "nonsense", message: "Please quote for 3 kW." }).success).toBe(false);
    expect(quoteRequestSchema.safeParse({ vendorId: "v1", topic: "rooftop-solar", message: "x".repeat(1001) }).success).toBe(false);
  });
  it("trims messages and refuses empty ones", () => {
    expect(quoteMessageSchema.parse({ body: "  hello  " }).body).toBe("hello");
    expect(quoteMessageSchema.safeParse({ body: "   " }).success).toBe(false);
  });
  it("asks the administrator to say where they checked", () => {
    expect(vendorVerifySchema.safeParse({ note: "ok" }).success).toBe(false);
    expect(vendorVerifySchema.safeParse({ note: "Found on the PGVCL list, ID matches" }).success).toBe(true);
  });
});

describe("public directory", () => {
  const entries = buildPublicDirectory("2026-11-14T00:00:00.000Z");
  it("has only entries that point at their own source and invent no contact details", () => {
    expect(entries.length).toBeGreaterThanOrEqual(6);
    for (const e of entries) {
      expect(e.isSample).toBe(false);
      expect(e.sourceUrl).toMatch(/^https:\/\//);
      expect(e.phone).toBeUndefined();
      expect(["official", "company"]).toContain(e.listingKind);
      expect(e.ownerUserId).toBeUndefined();
    }
  });
  it("includes the four electricity companies and GEDA", () => {
    const ids = entries.map((e) => e.id);
    for (const id of ["public-pgvcl", "public-dgvcl", "public-mgvcl", "public-ugvcl", "public-geda"]) expect(ids).toContain(id);
  });
});

describe("storing quotes", () => {
  process.env.LIFEOS_DATA_DIR = mkdtempSync(join(tmpdir(), "lifeos-quotes-"));
  const at = "2026-11-14T05:00:00.000Z";
  const request: QuoteRequest = { id: "q1", citizenId: "c1", vendorId: "v1", topic: "rooftop-solar", status: "open", createdAt: at, updatedAt: at };
  const first: QuoteMessage = { id: "m1", requestId: "q1", authorId: "c1", authorRole: "citizen", body: "Please quote for 3 kW.", createdAt: at };
  it("keeps a request with its first message, then replies in order", async () => {
    const { fileStore } = await import("@/lib/store/file-store");
    await fileStore.createQuote(request, first);
    await fileStore.addMessage({ id: "m2", requestId: "q1", authorId: "i1", authorRole: "installer", body: "Sure. Rs 1.9 lakh before subsidy.", createdAt: "2026-11-14T06:00:00.000Z" });
    const messages = await fileStore.listMessages(["q1"]);
    expect(messages.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect((await fileStore.getQuote("q1"))?.updatedAt).toBe("2026-11-14T06:00:00.000Z");
  });
  it("filters by household and by vendor, and closes a conversation", async () => {
    const { fileStore } = await import("@/lib/store/file-store");
    expect((await fileStore.listQuotes({ citizenId: "c1" })).length).toBe(1);
    expect((await fileStore.listQuotes({ citizenId: "someone-else" })).length).toBe(0);
    expect((await fileStore.listQuotes({ vendorIds: ["v1"] })).length).toBe(1);
    expect((await fileStore.listQuotes({ vendorIds: [] })).length).toBe(0);
    expect((await fileStore.setQuoteStatus("q1", "closed"))?.status).toBe("closed");
    expect(await fileStore.setQuoteStatus("nope", "closed")).toBeNull();
  });
  it("records and clears an official-list check on a vendor", async () => {
    const { fileStore } = await import("@/lib/store/file-store");
    const vendors = await fileStore.listVendors();
    const id = vendors.find((v) => v.id === "public-geda")?.id ?? vendors[0].id;
    const checked = await fileStore.setVendorVerification(id, { verifiedOn: "2026-11-14", verifiedNote: "Found on the official list" });
    expect(checked?.verifiedOn).toBe("2026-11-14");
    const cleared = await fileStore.setVendorVerification(id, null);
    expect(cleared?.verifiedOn).toBeUndefined();
    expect(await fileStore.setVendorVerification("missing", null)).toBeNull();
  });
});
