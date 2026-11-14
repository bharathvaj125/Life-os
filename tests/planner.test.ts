import { describe, expect, it } from "vitest";
import { GUJARAT_TARIFF, NO_TOD, applianceCost, bestStartWithin, energyBill, newPlanItem, planItem, planTotals, todPerRun } from "@/lib/calculations/planner";

const washer = { name: "Washing machine", kw: 0.5, hours: 1, daysPerWeek: 4 };

describe("day planner", () => {
  it("leaves an appliance out until the user places it", () => {
    const item = newPlanItem(washer, "a1");
    expect(item.start).toBeNull();
    expect(planItem(item, 250, GUJARAT_TARIFF, NO_TOD)).toBeNull();
    expect(planTotals([item], 250, GUJARAT_TARIFF, NO_TOD).placed).toBe(0);
  });

  it("saves carbon by moving from the evening peak to midday", () => {
    const item = { ...newPlanItem(washer, "a1"), start: 19 };
    const plan = planItem(item, 250, GUJARAT_TARIFF, NO_TOD);
    expect(plan?.best).toBeGreaterThanOrEqual(10);
    expect(plan?.best).toBeLessThan(15);
    expect(plan!.saveKgPerMonth).toBeGreaterThan(0);
    expect(plan!.saveInrPerMonth).toBe(0); // an ordinary meter bills every hour alike
  });

  it("only saves rupees when the meter has time-of-day rates", () => {
    const item = { ...newPlanItem({ ...washer, kw: 2 }, "a1"), start: 19 };
    const plan = planItem(item, 250, GUJARAT_TARIFF, { peakExtraInr: 1, solarRebateInr: 0.5 });
    expect(plan!.saveInrPerMonth).toBeGreaterThan(0);
    expect(todPerRun(2, 19, 1, { peakExtraInr: 1, solarRebateInr: 0.5 })).toBe(2);
    expect(todPerRun(2, 12, 1, { peakExtraInr: 1, solarRebateInr: 0.5 })).toBe(-1);
  });

  it("respects the hours an appliance is allowed to run in", () => {
    expect(bestStartWithin({ hours: 1, from: 18, to: 23 })).toBe(22);
    expect(bestStartWithin({ hours: 4, from: 20, to: 23 })).toBeNull();
    const item = { ...newPlanItem(washer, "a1"), start: 19, from: 16, to: 20 };
    expect(planItem(item, 250, GUJARAT_TARIFF, NO_TOD)!.best).toBe(16);
  });

  it("bills by slab, with fuel adjustment and duty", () => {
    const t = { slabs: [{ upTo: 50, rate: 3 }, { upTo: 100, rate: 4 }, { upTo: Infinity, rate: 5 }], fuelAdjInrPerKwh: 1, dutyPct: 10 };
    expect(energyBill(0, t)).toBe(0);
    expect(energyBill(50, t)).toBeCloseTo((50 * 3 + 50 * 1) * 1.1, 6);
    expect(energyBill(120, t)).toBeCloseTo((50 * 3 + 50 * 4 + 20 * 5 + 120) * 1.1, 6);
    // The last units are charged at the top slab the household reaches.
    expect(applianceCost(10, 120, t)).toBeCloseTo(10 * (5 + 1) * 1.1, 6);
  });
});
