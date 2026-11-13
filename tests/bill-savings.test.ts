import { describe, expect, it } from "vitest";
import { BILL_SAVINGS_TASK_ID, billSavingsKey, evaluateBillSavings } from "@/lib/calculations/bill-savings";
import { calculateFootprint } from "@/lib/calculations/footprint";
import type { Snapshot } from "@/types";

const snap = (period: string, kwh: number): Snapshot => {
  const input = { electricityKwh: kwh, lpgCylinders: 0, carKm: 0, bikeKm: 0, publicKm: 0 };
  return { ...input, ...calculateFootprint(input), id: period, userId: "u", period, createdAt: "" };
};

const TODAY = "2026-11";

describe("bill-based savings bonus", () => {
  it("awards points and a measured impact when units fall against last month", () => {
    const bonus = evaluateBillSavings(snap("2026-10", 300), snap("2026-11", 255), TODAY);
    expect(bonus).not.toBeNull();
    expect(bonus?.reductionPct).toBe(15);
    expect(bonus?.kwhSaved).toBe(45);
    expect(bonus?.impactKg).toBe(32); // 45 kWh x 0.71
    expect(bonus?.points).toBe(50);
    expect(bonus?.dedupeKey).toBe(billSavingsKey("2026-11"));
    expect(bonus?.dedupeKey.startsWith(`${BILL_SAVINGS_TASK_ID}:`)).toBe(true);
  });
  it("scales points with the size of the drop", () => {
    expect(evaluateBillSavings(snap("2026-10", 300), snap("2026-11", 280), TODAY)?.points).toBe(30); // 6.7%
    expect(evaluateBillSavings(snap("2026-10", 300), snap("2026-11", 270), TODAY)?.points).toBe(50); // 10%
    expect(evaluateBillSavings(snap("2026-10", 300), snap("2026-11", 230), TODAY)?.points).toBe(70); // 23%
  });
  it("gives nothing for small drops, rises, or no drop", () => {
    expect(evaluateBillSavings(snap("2026-10", 300), snap("2026-11", 290), TODAY)).toBeNull(); // 3.3%
    expect(evaluateBillSavings(snap("2026-10", 300), snap("2026-11", 300), TODAY)).toBeNull();
    expect(evaluateBillSavings(snap("2026-10", 300), snap("2026-11", 340), TODAY)).toBeNull();
  });
  it("ignores implausible drops that look like typos or an empty home", () => {
    expect(evaluateBillSavings(snap("2026-10", 300), snap("2026-11", 100), TODAY)).toBeNull(); // 67%
    expect(evaluateBillSavings(snap("2026-10", 300), snap("2026-11", 150), TODAY)?.points).toBe(70); // exactly 50%
  });
  it("needs the calendar month just before, not any earlier month", () => {
    expect(evaluateBillSavings(snap("2026-08", 300), snap("2026-11", 200), TODAY)).toBeNull();
    expect(evaluateBillSavings(undefined, snap("2026-11", 200), TODAY)).toBeNull();
  });
  it("only lets the current or previous month earn, and never a future month", () => {
    expect(evaluateBillSavings(snap("2026-09", 300), snap("2026-10", 250), TODAY)?.period).toBe("2026-10");
    expect(evaluateBillSavings(snap("2026-07", 300), snap("2026-08", 250), TODAY)).toBeNull();
    expect(evaluateBillSavings(snap("2026-11", 300), snap("2026-12", 250), TODAY)).toBeNull();
  });
  it("crosses a year boundary", () => {
    expect(evaluateBillSavings(snap("2026-12", 300), snap("2027-01", 250), "2027-01")?.points).toBe(50); // 16.7%
  });
});
