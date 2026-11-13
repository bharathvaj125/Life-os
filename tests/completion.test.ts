import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AC_TASK_MIN_MAX_C, TASKS, formatHour, getTask, taskApplies, taskBlockReason } from "@/features/gamification/tasks";
import { areaCentre, locateByPincode } from "@/lib/maps/locate";
import { fileStore } from "@/lib/store/file-store";
import { proofReviewSchema, proofSchema } from "@/lib/validation";
import { EMPTY_EQUIPMENT } from "@/features/equipment/catalog";
import type { TaskProof } from "@/types";

const task = (id: string) => {
  const t = getTask(id);
  if (!t) throw new Error(`missing task ${id}`);
  return t;
};

describe("map positions", () => {
  it("places a listing near its city centre and never exactly on it", () => {
    const centre = areaCentre("380");
    const spot = locateByPincode("380015", "vendor-1");
    expect(centre).not.toBeNull();
    expect(spot).not.toBeNull();
    expect(Math.abs(spot![0] - centre![0])).toBeLessThanOrEqual(0.02);
    expect(Math.abs(spot![1] - centre![1])).toBeLessThanOrEqual(0.02);
  });
  it("is repeatable for one key and spreads different keys apart", () => {
    expect(locateByPincode("380015", "a")).toEqual(locateByPincode("380015", "a"));
    expect(locateByPincode("380015", "a")).not.toEqual(locateByPincode("380015", "b"));
  });
  it("returns null for a PIN code outside Gujarat", () => {
    expect(locateByPincode("110001", "a")).toBeNull();
    expect(areaCentre("110")).toBeNull();
  });
});

describe("task time windows", () => {
  const pump = task("pump-midday");
  it("opens at 10 AM and closes at 3 PM India time", () => {
    expect(taskBlockReason(pump, { hour: 9 })).toMatch(/between 10 AM and 3 PM/);
    expect(taskBlockReason(pump, { hour: 10 })).toBeNull();
    expect(taskBlockReason(pump, { hour: 14 })).toBeNull();
    expect(taskBlockReason(pump, { hour: 15 })).toMatch(/between 10 AM and 3 PM/);
    expect(taskBlockReason(pump, { hour: 23 })).not.toBeNull();
  });
  it("applies to the solar self-use task too and leaves other tasks open all day", () => {
    expect(taskBlockReason(task("solar-selfuse"), { hour: 2 })).not.toBeNull();
    expect(taskBlockReason(task("standby-off"), { hour: 2 })).toBeNull();
  });
  it("formats hours the way people read them", () => {
    expect(formatHour(0)).toBe("12 AM");
    expect(formatHour(10)).toBe("10 AM");
    expect(formatHour(12)).toBe("12 PM");
    expect(formatHour(15)).toBe("3 PM");
  });
});

describe("weather rule for the AC task", () => {
  const ac = task("ac-setpoint");
  it("blocks the task on a cool day", () => {
    expect(taskBlockReason(ac, { hour: 12, maxC: AC_TASK_MIN_MAX_C - 0.5 })).toMatch(/not needed today/);
  });
  it("allows it at or above the threshold", () => {
    expect(taskBlockReason(ac, { hour: 12, maxC: AC_TASK_MIN_MAX_C })).toBeNull();
    expect(taskBlockReason(ac, { hour: 12, maxC: 41 })).toBeNull();
  });
  it("never blocks when the weather is unknown, so an outage cannot lock anyone out", () => {
    expect(taskBlockReason(ac, { hour: 12, maxC: null })).toBeNull();
    expect(taskBlockReason(ac, { hour: 12 })).toBeNull();
  });
  it("does not apply the weather rule to other tasks", () => {
    expect(taskBlockReason(task("standby-off"), { hour: 12, maxC: 15 })).toBeNull();
  });
});

describe("photo-proof tasks", () => {
  it("are flagged, one-time and worth more than a daily habit", () => {
    const proofTasks = TASKS.filter((t) => t.proof === "photo");
    expect(proofTasks.map((t) => t.id).sort()).toEqual(["bee-appliance", "led-swap", "solar-installed"]);
    for (const t of proofTasks) expect(t.cadence).toBe("once");
  });
  it("shows the solar-installed task only to homes that have rooftop solar", () => {
    expect(taskApplies(task("solar-installed"), { ...EMPTY_EQUIPMENT, rooftopSolar: true })).toBe(true);
    expect(taskApplies(task("solar-installed"), { ...EMPTY_EQUIPMENT, rooftopSolar: false })).toBe(false);
  });
});

describe("photo upload rules", () => {
  const jpeg = (body: string) => `data:image/jpeg;base64,/9j/${body}`;
  it("accepts a JPEG data URL", () => {
    expect(proofSchema.safeParse({ image: jpeg("AAAA") }).success).toBe(true);
  });
  it("refuses other types, plain text and oversized photos", () => {
    expect(proofSchema.safeParse({ image: "data:image/png;base64,iVBORw0KGgo=" }).success).toBe(false);
    expect(proofSchema.safeParse({ image: "data:text/html;base64,PGgxPg==" }).success).toBe(false);
    expect(proofSchema.safeParse({ image: "https://example.com/a.jpg" }).success).toBe(false);
    expect(proofSchema.safeParse({ image: jpeg("A".repeat(460_000)) }).success).toBe(false);
  });
  it("only allows approving or rejecting", () => {
    expect(proofReviewSchema.safeParse({ decision: "approved" }).success).toBe(true);
    expect(proofReviewSchema.safeParse({ decision: "pending" }).success).toBe(false);
  });
});

describe("storing proofs", () => {
  process.env.LIFEOS_DATA_DIR = mkdtempSync(join(tmpdir(), "lifeos-proofs-"));
  const proof = (id: string, userId = "u1", taskId = "led-swap"): TaskProof => ({ id, userId, taskId, status: "pending", image: "data:image/jpeg;base64,/9j/AAAA", createdAt: "2026-11-13T05:00:00.000Z" });

  it("holds one live proof per user and task, but lets a rejected one be replaced", async () => {
    expect((await fileStore.addTaskProof(proof("p1"))).ok).toBe(true);
    expect(await fileStore.addTaskProof(proof("p2"))).toEqual({ ok: false, reason: "exists" });
    expect((await fileStore.addTaskProof(proof("p3", "u2"))).ok).toBe(true);
    await fileStore.reviewTaskProof("p1", "rejected", "2026-11-13T06:00:00.000Z");
    expect((await fileStore.addTaskProof(proof("p4"))).ok).toBe(true);
  });
  it("deletes the photo when it is reviewed, whatever the decision", async () => {
    const reviewed = await fileStore.reviewTaskProof("p3", "approved", "2026-11-13T06:00:00.000Z");
    expect(reviewed?.status).toBe("approved");
    expect(reviewed?.image).toBeNull();
    const stored = await fileStore.listTaskProofs({ userId: "u2" });
    expect(stored.every((p) => p.image === null)).toBe(true);
  });
  it("filters by status and reports an unknown id as null", async () => {
    const pending = await fileStore.listTaskProofs({ status: "pending" });
    expect(pending.map((p) => p.id)).toEqual(["p4"]);
    expect(await fileStore.reviewTaskProof("nope", "approved", "2026-11-13T06:00:00.000Z")).toBeNull();
  });
});
