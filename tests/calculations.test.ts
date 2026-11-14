import { describe, expect, it } from "vitest";
import { calculateFootprint, trendOf } from "@/lib/calculations/footprint";
import { estimateSolar, subsidyFor } from "@/lib/calculations/solar";
import { DAILY_GOAL_POINTS, challengeProgress, computeStreak, dedupeKeyFor, evaluateCompletion, levelFor } from "@/lib/calculations/gamification";
import { generateNudges } from "@/lib/calculations/nudges";
import { MIN_GROUP_SIZE, aggregateByRegion } from "@/lib/calculations/aggregate";
import { bestStart, scheduleImpact, touchesPeak, windowIndex } from "@/lib/calculations/schedule";
import { addDays, isoWeekKey, istDate, istHour, shiftPeriod } from "@/lib/dates";
import { getTask } from "@/features/gamification/tasks";
import type { Challenge, Completion, Snapshot, User } from "@/types";

const input = { electricityKwh: 200, lpgCylinders: 1, carKm: 100, bikeKm: 0, publicKm: 0 };
const snap = (period: string, kwh: number, extra: Partial<Snapshot> = {}): Snapshot => ({ ...input, ...calculateFootprint({ ...input, electricityKwh: kwh }), electricityKwh: kwh, id: period, userId: "u", period, createdAt: "", ...extra });

describe("footprint", () => {
  it("adds electricity, travel and LPG using the stated factors", () => {
    const f = calculateFootprint(input);
    expect(f.electricityKg).toBe(142);
    expect(f.commuteKg).toBe(17);
    expect(f.lpgKg).toBe(42.3);
    expect(f.totalKg).toBe(201.3);
  });
  it("is zero for a household that reports nothing", () => {
    expect(calculateFootprint({ electricityKwh: 0, lpgCylinders: 0, carKm: 0, bikeKm: 0, publicKm: 0 }).totalKg).toBe(0);
  });
  it("reports change versus the previous month and the baseline", () => {
    const t = trendOf([snap("2026-09", 200), snap("2026-10", 100)]);
    expect(t.changePct).toBeLessThan(0);
    expect(t.baselineKg).toBe(201.3);
  });
  it("has no change with a single month", () => {
    expect(trendOf([snap("2026-10", 200)]).changePct).toBeUndefined();
  });
});

describe("solar", () => {
  const base = { roofAreaM2: 60, monthlyKwh: 400, tariffInrPerKwh: 6, shade: "none" as const };
  it("sizes by the smaller of roof and demand", () => {
    const small = estimateSolar({ ...base, roofAreaM2: 20 });
    expect(small.limitedBy).toBe("roof");
    expect(small.capacityKwp).toBe(1.2);
    expect(estimateSolar({ ...base, roofAreaM2: 500 }).limitedBy).toBe("demand");
  });
  it("gives ordered ranges and a payback range", () => {
    const e = estimateSolar(base);
    expect(e.annualKwh.low).toBeLessThan(e.annualKwh.high);
    expect(e.paybackYears.low).toBeLessThanOrEqual(e.paybackYears.high);
    expect(e.netCostInr.high).toBeLessThanOrEqual(e.costInr.high);
  });
  it("flags tiny systems as not viable", () => {
    expect(estimateSolar({ ...base, roofAreaM2: 10, shade: "heavy" }).viable).toBe(false);
  });
  it("applies shade as a reduction", () => {
    expect(estimateSolar({ ...base, shade: "heavy" }).capacityKwp).toBeLessThan(estimateSolar(base).capacityKwp);
  });
  it("caps the subsidy and always tells the user it is unverified", () => {
    expect(subsidyFor(10)).toBe(78000);
    expect(subsidyFor(1)).toBe(30000);
    expect(estimateSolar(base).notes.join(" ")).toMatch(/unverified/i);
  });
});

describe("gamification", () => {
  const ac = getTask("ac-setpoint")!;
  const once = getTask("led-swap")!;
  it("rewards a task once per window", () => {
    expect(evaluateCompletion(ac, new Set(), "2026-11-03").ok).toBe(true);
    const key = new Set([dedupeKeyFor(ac, "2026-11-03")]);
    expect(evaluateCompletion(ac, key, "2026-11-03").ok).toBe(false);
    expect(evaluateCompletion(ac, key, "2026-11-04").ok).toBe(true);
  });
  it("never rewards one-time tasks twice", () => {
    expect(evaluateCompletion(once, new Set([dedupeKeyFor(once, "2026-01-01")]), "2026-12-01").ok).toBe(false);
  });
  it("has no daily ceiling: an active household can pass the daily goal", () => {
    expect(DAILY_GOAL_POINTS).toBe(80);
    expect(evaluateCompletion(ac, new Set(), "2026-11-03").ok).toBe(true);
  });
  it("counts streaks, allowing today to be still empty", () => {
    expect(computeStreak(["2026-11-01", "2026-11-02", "2026-11-03"], "2026-11-03").current).toBe(3);
    expect(computeStreak(["2026-11-01", "2026-11-02"], "2026-11-03").current).toBe(2);
    expect(computeStreak(["2026-10-01"], "2026-11-03").current).toBe(0);
    expect(computeStreak(["2026-10-01", "2026-10-02", "2026-10-10"], "2026-11-03").longest).toBe(2);
  });
  it("assigns levels", () => {
    expect(levelFor(0).name).toBe("Seedling");
    expect(levelFor(160).name).toBe("Sapling");
    expect(levelFor(5000).nextAt).toBeNull();
  });
  it("counts only member completions inside the window", () => {
    const ch: Challenge = { id: "c", title: "", description: "", region: "", regionPrefix: null, metric: "actions", target: 4, startsOn: "2026-11-01", endsOn: "2026-11-30" };
    const mk = (userId: string, completedOn: string): Completion => ({ id: userId + completedOn, userId, taskId: "t", dedupeKey: userId + completedOn, completedOn, points: 10, impactKg: 1, createdAt: "" });
    const p = challengeProgress(ch, [{ challengeId: "c", userId: "a", joinedAt: "" }], [mk("a", "2026-11-02"), mk("a", "2026-10-30"), mk("b", "2026-11-02")]);
    expect(p.value).toBe(1);
    expect(p.pct).toBe(25);
  });
});

describe("nudges", () => {
  const now = new Date("2026-04-10T06:00:00Z"); // 11:30 IST, in the AC season, outside the evening peak
  it("asks for a first month when there is no data", () => {
    expect(generateNudges({ householdSize: 3, snapshots: [], now })[0].id).toBe("add-baseline");
  });
  it("flags a rise in usage and uses the user's own rate for rupees", () => {
    const n = generateNudges({ householdSize: 4, snapshots: [snap("2026-03", 200, { billAmountInr: 1000 }), snap("2026-04", 260, { billAmountInr: 1300 })], now });
    const up = n.find((x) => x.id === "usage-up");
    expect(up?.savingKwhPerMonth).toBe(60);
    expect(up?.savingInrPerMonth).toBe(300);
  });
  it("only raises the peak alert in the evening", () => {
    const evening = new Date("2026-04-10T13:30:00Z"); // 19:00 IST
    expect(generateNudges({ householdSize: 3, snapshots: [snap("2026-04", 100)], now: evening })[0].id).toBe("peak-now");
    expect(generateNudges({ householdSize: 3, snapshots: [snap("2026-04", 100)], now }).some((x) => x.id === "peak-now")).toBe(false);
  });
  it("does not invent rupee savings without a bill amount", () => {
    const n = generateNudges({ householdSize: 2, snapshots: [snap("2026-04", 300)], now });
    expect(n.every((x) => x.savingInrPerMonth === undefined)).toBe(true);
  });
});

describe("admin aggregation", () => {
  const user = (id: string, pincode: string): User => ({ id, role: "citizen", displayName: id, pincode, householdSize: 3, leaderboardOptIn: false, isDemo: false, createdAt: "" });
  it("hides groups below the threshold and exposes no numbers for them", () => {
    const users = [...Array.from({ length: MIN_GROUP_SIZE }, (_, i) => user(`a${i}`, "380015")), user("b0", "382010"), user("b1", "382010")];
    const snaps = users.map((u) => snap("2026-10", 100, { userId: u.id, id: u.id }));
    const { rows } = aggregateByRegion(users, snaps, []);
    const shown = rows.find((r) => r.prefix === "380")!;
    const hidden = rows.find((r) => r.prefix === "382")!;
    expect(shown.households).toBe(MIN_GROUP_SIZE);
    expect(shown.avgKwh).toBe(100);
    expect(hidden).toMatchObject({ suppressed: true, households: null, avgKwh: null, totalKg: null, actions: null });
  });
});

describe("schedule", () => {
  const a = { id: "x", name: "x", kw: 2, hours: 1, runsPerWeek: 7 };
  it("rates evening above midday and finds a cleaner start", () => {
    expect(windowIndex(19, 1)).toBeGreaterThan(windowIndex(12, 1));
    expect(touchesPeak(19, 1)).toBe(true);
    expect(touchesPeak(12, 1)).toBe(false);
    expect(scheduleImpact(a, bestStart(a)).kgPerMonth).toBeLessThan(scheduleImpact(a, 19).kgPerMonth);
  });
  it("wraps past midnight", () => {
    expect(touchesPeak(21, 3)).toBe(true);
    expect(windowIndex(23, 3)).toBeGreaterThan(0);
  });
  it("only prices the peak when a surcharge is given", () => {
    expect(scheduleImpact(a, 19).peakSurchargeInrPerMonth).toBeUndefined();
    expect(scheduleImpact(a, 19, { inrPerKwh: 6, peakSurchargePct: 20 }).peakSurchargeInrPerMonth).toBeGreaterThan(0);
  });
});

describe("dates", () => {
  it("uses India time, not UTC", () => {
    expect(istDate(new Date("2026-11-03T20:00:00Z"))).toBe("2026-11-04");
    expect(istHour(new Date("2026-11-03T18:30:00Z"))).toBe(0);
  });
  it("shifts days, months and ISO weeks", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(shiftPeriod("2026-01", -1)).toBe("2025-12");
    expect(isoWeekKey("2026-11-03")).toBe("2026-W45");
  });
});
