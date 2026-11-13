import { describe, expect, it } from "vitest";
import { generateNudges } from "@/lib/calculations/nudges";
import { calculateFootprint } from "@/lib/calculations/footprint";
import { describeToday, mjToKwh, solarYieldTodayKwh, type Weather } from "@/lib/calculations/weather";
import { placeForPincode } from "@/lib/weather/places";
import type { Snapshot } from "@/types";

const weather = (over: Partial<Weather["today"]> = {}): Weather => ({
  city: "Ahmedabad",
  observedAt: "2026-11-13T12:00",
  tempC: 30,
  feelsLikeC: 31,
  humidityPct: 30,
  cloudPct: 5,
  today: { maxC: 31, sunshineHours: 5, radiationKwhM2: 4.5, ...over },
});

const input = { electricityKwh: 300, billAmountInr: 2000, lpgCylinders: 0, carKm: 0, bikeKm: 0, publicKm: 0 };
const snapshot: Snapshot = { ...input, ...calculateFootprint(input), id: "s", userId: "u", period: "2026-11", createdAt: "" };
// 11 AM IST on a November day: outside the evening peak, and not an AC month on the calendar.
const nov = new Date("2026-11-13T05:30:00.000Z");
const may = new Date("2026-05-13T05:30:00.000Z");
const ids = (w: Weather | null | undefined, now = nov) => generateNudges({ householdSize: 4, snapshots: [snapshot], now, weather: w }).map((n) => n.id);

describe("pin code to place", () => {
  it("maps Gujarat PIN prefixes to a city", () => {
    expect(placeForPincode("380015")?.city).toBe("Ahmedabad");
    expect(placeForPincode("395003")?.city).toBe("Surat");
    expect(placeForPincode(" 382010 ")?.city).toBe("Gandhinagar");
  });
  it("returns null outside Gujarat", () => {
    expect(placeForPincode("110001")).toBeNull();
    expect(placeForPincode("560001")).toBeNull();
  });
});

describe("solar from weather", () => {
  it("converts MJ/m² to kWh/m²", () => {
    expect(mjToKwh(17.14)).toBe(4.8);
    expect(mjToKwh(0)).toBe(0);
  });
  it("scales expected generation with system size and radiation, with a performance ratio", () => {
    expect(solarYieldTodayKwh(1, 4.8)).toBe(3.6);
    expect(solarYieldTodayKwh(2, 4.8)).toBe(7.2);
    expect(solarYieldTodayKwh(2.3, 0)).toBe(0);
  });
  it("never goes negative on bad inputs", () => {
    expect(solarYieldTodayKwh(-1, 4)).toBe(0);
    expect(solarYieldTodayKwh(2, -3)).toBe(0);
  });
});

describe("describing the day", () => {
  it("classifies hot, sunny, mild and mixed days", () => {
    expect(describeToday(weather({ maxC: 38 })).tone).toBe("hot");
    expect(describeToday(weather({ maxC: 33, sunshineHours: 9 })).tone).toBe("sunny");
    expect(describeToday(weather({ maxC: 26, sunshineHours: 3 })).tone).toBe("mild");
    expect(describeToday(weather({ maxC: 31, sunshineHours: 4 })).tone).toBe("cloudy");
  });
});

describe("weather-aware nudges", () => {
  it("nudges about the AC on a hot day even outside the usual AC months", () => {
    const out = ids(weather({ maxC: 38 }));
    expect(out).toContain("ac-setpoint");
    const nudge = generateNudges({ householdSize: 4, snapshots: [snapshot], now: nov, weather: weather({ maxC: 38 }) }).find((n) => n.id === "ac-setpoint");
    expect(nudge?.why).toContain("Ahmedabad reaches 38");
  });
  it("does not nudge about the AC in the hot season when the forecast is cool", () => {
    expect(ids(weather({ maxC: 27 }), may)).not.toContain("ac-setpoint");
  });
  it("suggests resting the AC on a mild day", () => {
    const out = ids(weather({ maxC: 26 }));
    expect(out).toContain("mild-day");
    expect(out).not.toContain("ac-setpoint");
  });
  it("suggests drying outside on a sunny day", () => {
    expect(ids(weather({ sunshineHours: 9.5 }))).toContain("sun-dry");
    expect(ids(weather({ sunshineHours: 4 }))).not.toContain("sun-dry");
  });
  it("falls back to the calendar when there is no forecast", () => {
    expect(ids(null, may)).toContain("ac-setpoint");
    expect(ids(undefined, nov)).not.toContain("ac-setpoint");
    expect(ids(null, nov)).not.toContain("sun-dry");
  });
});
