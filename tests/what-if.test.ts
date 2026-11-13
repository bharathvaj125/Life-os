import { describe, expect, it } from "vitest";
import { ASSUMPTIONS, whatIf } from "@/lib/calculations/what-if";

const none = { acCount: 0, acDegrees: 0, hasGeyser: false, geyserMinutes: 0, standbyOff: false };

describe("the what-if playground", () => {
  it("saves nothing when nothing is changed", () => {
    expect(whatIf(none).kwhPerMonth).toBe(0);
    expect(whatIf(none).kgPerMonth).toBe(0);
  });
  it("matches the action catalogue's AC assumption: one AC, two degrees, about 1 kWh a day", () => {
    const r = whatIf({ ...none, acCount: 1, acDegrees: 2 });
    // 8 h x 1.2 kW x 6% x 2 degrees = 1.152 kWh a day, 34.6 a month
    expect(r.kwhPerMonth).toBeCloseTo(34.6, 1);
  });
  it("scales with the number of ACs and ignores levers the home does not have", () => {
    expect(whatIf({ ...none, acCount: 2, acDegrees: 2 }).kwhPerMonth).toBeCloseTo(69.1, 1);
    expect(whatIf({ ...none, acCount: 0, acDegrees: 4 }).kwhPerMonth).toBe(0);
    expect(whatIf({ ...none, hasGeyser: false, geyserMinutes: 30 }).kwhPerMonth).toBe(0);
  });
  it("matches the geyser and standby assumptions", () => {
    // 3 kW for 10 minutes is 0.5 kWh a day, 15 a month
    expect(whatIf({ ...none, hasGeyser: true, geyserMinutes: 10 }).kwhPerMonth).toBe(15);
    expect(whatIf({ ...none, standbyOff: true }).kwhPerMonth).toBeCloseTo(ASSUMPTIONS.standbyKwhPerDay * 30, 5);
  });
  it("converts to carbon with the grid factor and to rupees at the household's own rate", () => {
    const r = whatIf({ ...none, hasGeyser: true, geyserMinutes: 10 }, { kwh: 200, billInr: 1600 });
    expect(r.kgPerMonth).toBeCloseTo(15 * 0.71, 1);
    expect(r.inrPerMonth).toBe(120); // 15 kWh at Rs 8 a unit
    expect(r.pctOfBill).toBeCloseTo(7.5, 1);
  });
  it("shows no rupees or share without a baseline", () => {
    const r = whatIf({ ...none, standbyOff: true });
    expect(r.inrPerMonth).toBeNull();
    expect(r.pctOfBill).toBeNull();
  });
});
