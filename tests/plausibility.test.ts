import { describe, expect, it } from "vitest";
import { MIN_KWH_PER_PERSON, plausibilityOf } from "@/lib/calculations/plausibility";

describe("unusually low months", () => {
  it("flags a month far below what a household of that size could use", () => {
    expect(plausibilityOf(5, 4).plausible).toBe(false);
    expect(plausibilityOf(15, 4).plausible).toBe(false);
  });
  it("accepts ordinary use", () => {
    expect(plausibilityOf(282, 4).plausible).toBe(true);
    expect(plausibilityOf(80, 4).plausible).toBe(true);
  });
  it("scales the floor with the household size", () => {
    expect(plausibilityOf(60, 1).plausible).toBe(true);
    expect(plausibilityOf(60, 4).plausible).toBe(false);
    expect(plausibilityOf(MIN_KWH_PER_PERSON * 3, 3).plausible).toBe(true);
    expect(plausibilityOf(MIN_KWH_PER_PERSON * 3 - 1, 3).plausible).toBe(false);
  });
  it("treats a size of zero as one person and reports the floor", () => {
    expect(plausibilityOf(25, 0).plausible).toBe(true);
    expect(plausibilityOf(25, 5).minKwh).toBe(100);
  });
});
