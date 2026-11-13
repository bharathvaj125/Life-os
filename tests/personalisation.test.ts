import { describe, expect, it } from "vitest";
import { EMPTY_EQUIPMENT, describeEquipment } from "@/features/equipment/catalog";
import { DEMO_ACCOUNTS } from "@/features/demo/accounts";
import { TASKS, getTask, taskApplies, tasksFor } from "@/features/gamification/tasks";
import { calculateFootprint } from "@/lib/calculations/footprint";
import { generateNudges } from "@/lib/calculations/nudges";
import { appliancesFor } from "@/lib/calculations/schedule";
import { buildDemoAccount } from "@/lib/store/demo-accounts";
import { homeProfileSchema, registerCitizenSchema, registerInstallerSchema } from "@/lib/validation";
import type { Equipment, Snapshot } from "@/types";

const eq = (over: Partial<Equipment>): Equipment => ({ ...EMPTY_EQUIPMENT, ...over });
const ids = (list: { id: string }[]) => list.map((t) => t.id);

describe("which tasks apply to a home", () => {
  it("hides tasks about appliances the home does not have", () => {
    const bare = ids(tasksFor(eq({})));
    expect(bare).toContain("standby-off");
    expect(bare).toContain("led-swap");
    for (const gone of ["ac-setpoint", "geyser-short", "air-dry", "transit-day", "pressure-cook", "ev-night-charge", "pump-midday", "solar-selfuse", "peak-shift"]) expect(bare).not.toContain(gone);
  });
  it("shows a task once the matching equipment is ticked", () => {
    expect(ids(tasksFor(eq({ acCount: 2 })))).toContain("ac-setpoint");
    expect(ids(tasksFor(eq({ geyser: true })))).toEqual(expect.arrayContaining(["geyser-short", "peak-shift"]));
    expect(ids(tasksFor(eq({ ev: "car" })))).toEqual(expect.arrayContaining(["ev-night-charge", "peak-shift"]));
    expect(ids(tasksFor(eq({ rooftopSolar: true })))).toContain("solar-selfuse");
    expect(ids(tasksFor(eq({ petrolTwoWheeler: true })))).toContain("transit-day");
    expect(ids(tasksFor(eq({ inductionStove: true })))).toContain("pressure-cook");
  });
  it("only suggests the solar estimate to homes without panels and with a usable roof", () => {
    expect(taskApplies(getTask("solar-estimate")!, eq({}), "own")).toBe(true);
    expect(taskApplies(getTask("solar-estimate")!, eq({ rooftopSolar: true }), "own")).toBe(false);
    expect(taskApplies(getTask("solar-estimate")!, eq({}), "none")).toBe(false);
  });
  it("treats unknown equipment as show-everything, except tasks that need one specific appliance", () => {
    const unknown = ids(tasksFor(undefined));
    expect(unknown).toContain("ac-setpoint");
    expect(unknown).toContain("geyser-short");
    for (const needs of ["ev-night-charge", "pump-midday", "solar-selfuse"]) expect(unknown).not.toContain(needs);
    expect(unknown.length).toBe(TASKS.length - 3);
  });
});

describe("tips follow the equipment", () => {
  const input = { electricityKwh: 320, billAmountInr: 2200, lpgCylinders: 0, carKm: 0, bikeKm: 0, publicKm: 0 };
  const snapshot: Snapshot = { ...input, ...calculateFootprint(input), id: "s", userId: "u", period: "2026-05", createdAt: "" };
  const may = new Date("2026-05-13T05:30:00.000Z"); // 11 AM IST in the hot season
  const evening = new Date("2026-05-13T13:30:00.000Z"); // 7 PM IST, the peak
  const nudgeIds = (equipment: Equipment | undefined, roofAccess?: "none" | "shared" | "own", now = may) => ids(generateNudges({ householdSize: 4, snapshots: [snapshot], now, equipment, roofAccess }));

  it("does not talk about the AC to a home without one, even in the hot season", () => {
    expect(nudgeIds(eq({}))).not.toContain("ac-setpoint");
    expect(nudgeIds(eq({ acCount: 1 }))).toContain("ac-setpoint");
    expect(nudgeIds(undefined)).toContain("ac-setpoint");
  });
  it("estimates a bigger AC saving for a home with several ACs", () => {
    const saving = (n: number) => generateNudges({ householdSize: 4, snapshots: [snapshot], now: may, equipment: eq({ acCount: n }) }).find((x) => x.id === "ac-setpoint")?.savingKwhPerMonth ?? 0;
    expect(saving(2)).toBeGreaterThan(saving(1));
  });
  it("names only the appliances the home has in the evening peak tip", () => {
    const tip = generateNudges({ householdSize: 4, snapshots: [snapshot], now: evening, equipment: eq({ geyser: true }) }).find((n) => n.id === "peak-now");
    expect(tip?.action).toContain("geyser");
    expect(tip?.action).not.toContain("washing machine");
    expect(tip?.action).not.toContain("EV charger");
  });
  it("gives appliance tips only to homes that own the appliance", () => {
    expect(nudgeIds(eq({}))).not.toEqual(expect.arrayContaining(["ev-night"]));
    expect(nudgeIds(eq({ ev: "two-wheeler" }))).toContain("ev-night");
    expect(nudgeIds(eq({ geyser: true }))).toContain("geyser-timer");
    expect(nudgeIds(eq({ waterPump: true }))).toContain("pump-midday");
    expect(nudgeIds(eq({ rooftopSolar: true }))).toContain("use-your-solar");
  });
  it("only suggests exploring solar to homes that could fit it", () => {
    expect(nudgeIds(eq({}), "own")).toContain("solar-look");
    expect(nudgeIds(eq({ rooftopSolar: true }), "own")).not.toContain("solar-look");
    expect(nudgeIds(eq({}), "none")).not.toContain("solar-look");
  });
});

describe("Cleanest Hour appliances", () => {
  it("lists only what the home owns, always with the iron", () => {
    expect(ids(appliancesFor(eq({})))).toEqual(["iron"]);
    expect(ids(appliancesFor(eq({ washingMachine: true, geyser: true, ev: "car" })))).toEqual(["washer", "geyser", "ev", "iron"]);
  });
  it("sizes an e-scooter charger smaller than a car charger", () => {
    const kw = (ev: "car" | "two-wheeler") => appliancesFor(eq({ ev })).find((a) => a.id === "ev")!.kw;
    expect(kw("two-wheeler")).toBeLessThan(kw("car"));
  });
  it("falls back to the general list when equipment is unknown", () => {
    expect(appliancesFor(undefined).length).toBeGreaterThan(1);
  });
});

describe("equipment summary", () => {
  it("describes what is ticked", () => {
    expect(describeEquipment(eq({ acCount: 2, geyser: true, ev: "car" }))).toEqual(["2 ACs", "Electric water heater", "Electric car"]);
    expect(describeEquipment(eq({}))).toEqual([]);
  });
});

describe("demo accounts", () => {
  const now = new Date("2026-11-13T06:00:00.000Z");
  it("has one for each role, labelled as a demo", () => {
    expect(DEMO_ACCOUNTS.map((a) => a.role).sort()).toEqual(["admin", "citizen", "citizen", "installer"]);
    for (const a of DEMO_ACCOUNTS) {
      const b = buildDemoAccount(a.key, now);
      expect(b.user.isDemo).toBe(true);
      expect(b.user.role).toBe(a.role);
      expect(b.user.displayName).toMatch(/\(demo\)$/);
    }
  });
  it("gives households three consecutive months and only tasks that apply to their equipment", () => {
    for (const key of ["patel", "desai"] as const) {
      const b = buildDemoAccount(key, now);
      expect(b.snapshots.map((s) => s.period)).toEqual(["2026-09", "2026-10", "2026-11"]);
      expect(b.completions.length).toBeGreaterThan(3);
      for (const c of b.completions) expect(taskApplies(getTask(c.taskId)!, b.user.equipment, b.user.roofAccess)).toBe(true);
    }
  });
  it("makes the two households different on purpose", () => {
    const patel = ids(tasksFor(buildDemoAccount("patel", now).user.equipment));
    const desai = ids(tasksFor(buildDemoAccount("desai", now).user.equipment));
    expect(patel).toContain("geyser-short");
    expect(desai).not.toContain("geyser-short");
    expect(desai).toEqual(expect.arrayContaining(["solar-selfuse", "pump-midday", "ev-night-charge"]));
    expect(patel).not.toContain("solar-selfuse");
  });
  it("links the installer to an approved sample listing it owns, and gives the administrator no household data", () => {
    const installer = buildDemoAccount("installer", now);
    expect(installer.vendor?.ownerUserId).toBe(installer.user.id);
    expect(installer.vendor?.status).toBe("approved");
    expect(installer.snapshots).toHaveLength(0);
    const admin = buildDemoAccount("admin", now);
    expect(admin.snapshots).toHaveLength(0);
    expect(admin.completions).toHaveLength(0);
    expect(admin.user.leaderboardOptIn).toBe(false);
  });
});

describe("registration rules", () => {
  const equipment = { acCount: 1, geyser: false, washingMachine: true, dryer: false, waterPump: false, inductionStove: false, lpg: true, petrolCar: false, petrolTwoWheeler: true, ev: "none", rooftopSolar: false, inverterBattery: false };
  const citizen = { displayName: "Aarav Patel", email: "Aarav@Example.com", password: "longenough1", pincode: "380015", householdSize: "4", homeType: "apartment", ownership: "tenant", roofAccess: "shared", equipment, electricityKwh: "282", billAmountInr: "1930" };

  it("accepts a full household and cleans the email", () => {
    const parsed = registerCitizenSchema.parse(citizen);
    expect(parsed.email).toBe("aarav@example.com");
    expect(parsed.householdSize).toBe(4);
    expect(parsed.equipment.acCount).toBe(1);
  });
  it("asks for the home profile and refuses a made-up one", () => {
    expect(registerCitizenSchema.safeParse({ ...citizen, homeType: undefined }).success).toBe(false);
    expect(registerCitizenSchema.safeParse({ ...citizen, roofAccess: "balcony" }).success).toBe(false);
    expect(registerCitizenSchema.safeParse({ ...citizen, equipment: { ...equipment, ev: "hoverboard" } }).success).toBe(false);
    expect(registerCitizenSchema.safeParse({ ...citizen, equipment: { ...equipment, acCount: 40 } }).success).toBe(false);
    expect(registerCitizenSchema.safeParse({ ...citizen, password: "short" }).success).toBe(false);
  });
  it("lets the home be edited without the account or the bill", () => {
    const { displayName, email, password, electricityKwh, billAmountInr, ...home } = citizen;
    void displayName; void email; void password; void electricityKwh; void billAmountInr;
    expect(homeProfileSchema.safeParse(home).success).toBe(true);
  });
  it("registers an installer with contact details and at least one service", () => {
    const base = { email: "Sun@Example.com", password: "longenough1", name: "Sunrise Solar", city: "Surat", pincode: "395003", services: ["rooftop-solar"], phone: "9876543210" };
    expect(registerInstallerSchema.parse(base).email).toBe("sun@example.com");
    expect(registerInstallerSchema.safeParse({ ...base, phone: "" }).success).toBe(false);
    expect(registerInstallerSchema.safeParse({ ...base, services: [] }).success).toBe(false);
  });
});
