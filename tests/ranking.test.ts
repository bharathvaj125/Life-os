import { describe, expect, it } from "vitest";
import { evidenceOf, rankDistricts, rankingScore, rankingWeight } from "@/lib/calculations/ranking";
import { getTaskFor, tasksFor } from "@/features/gamification/tasks";
import { weekStrip } from "@/lib/calculations/gamification";
import type { Equipment } from "@/types";

const eq = (over: Partial<Equipment>): Equipment => ({ acCount: 0, geyser: false, washingMachine: false, dryer: false, waterPump: false, inductionStove: false, lpg: true, petrolCar: false, petrolTwoWheeler: false, ev: "none", rooftopSolar: false, inverterBattery: false, ...over });

describe("ranking score", () => {
  it("weighs evidence above unchecked claims", () => {
    expect(evidenceOf("led-swap")).toBe("photo");
    expect(evidenceOf("join-challenge")).toBe("system");
    expect(evidenceOf("standby-off")).toBe("self");
    expect(rankingWeight("led-swap", false)).toBe(1);
    expect(rankingWeight("standby-off", false)).toBe(0.25);
    expect(rankingWeight("standby-off", true)).toBe(0.5);
    expect(rankingWeight("bill-savings", false)).toBeLessThan(rankingWeight("bill-savings", true));
  });
  it("lets one approved photo outweigh several unchecked ticks", () => {
    const ticks = rankingScore(Array.from({ length: 6 }, () => ({ taskId: "standby-off", points: 10 })), false);
    const photo = rankingScore([{ taskId: "led-swap", points: 40 }], false);
    expect(ticks.claimed).toBe(60);
    expect(ticks.score).toBe(15);
    expect(photo.score).toBe(40);
    expect(photo.verified).toBe(40);
  });
});

describe("district ranking", () => {
  const rows = (prefix: string, scores: number[]) => scores.map((score) => ({ prefix, score, verified: score, claimed: score }));
  it("ranks by average per household, and holds back districts with too few households", () => {
    const out = rankDistricts([...rows("380", [10, 20, 30]), ...rows("395", [50, 50, 50, 50]), ...rows("390", [500])]);
    expect(out.map((d) => [d.prefix, d.rank])).toEqual([["395", 1], ["380", 2], ["390", null]]);
    expect(out[0].avgScore).toBe(50);
  });
});

describe("vehicle wording", () => {
  const title = (e: Partial<Equipment> | undefined) => tasksFor(e ? eq(e) : undefined).find((t) => t.id === "transit-day")?.title;
  it("names the vehicle the home has", () => {
    expect(title({ petrolCar: true })).toMatch(/car/i);
    expect(title({ petrolTwoWheeler: true })).toMatch(/bike or scooter/i);
    expect(title({ petrolCar: true, petrolTwoWheeler: true })).toMatch(/car or two-wheeler/i);
    expect(title(undefined)).toMatch(/vehicle/i);
  });
  it("counts the smaller saving for a two-wheeler", () => {
    expect(getTaskFor("transit-day", eq({ petrolTwoWheeler: true }))!.kgSaved).toBeLessThan(getTaskFor("transit-day", eq({ petrolCar: true }))!.kgSaved);
  });
});

describe("week strip", () => {
  it("marks the days with a completed habit and flags today", () => {
    const week = weekStrip(["2026-11-14", "2026-11-12"], "2026-11-14");
    expect(week).toHaveLength(7);
    expect(week[6]).toMatchObject({ done: true, today: true, label: "S" });
    expect(week[4].done).toBe(true);
    expect(week[5].done).toBe(false);
  });
});
