import "server-only";
import { randomUUID } from "node:crypto";
import type { TaskProof, User } from "@/types";
import { ApiError } from "@/lib/api";
import { getTask, taskApplies } from "@/features/gamification/tasks";
import { getRepository } from "@/lib/store";
import { completeTask } from "./actions";

/** Sends a photo for a task that needs one. It waits for an administrator; nothing is awarded yet. */
export async function submitTaskProof(user: User, taskId: string, image: string, now: Date = new Date()): Promise<{ id: string; status: "pending" }> {
  const task = getTask(taskId);
  if (!task) throw new ApiError(404, "That task does not exist.");
  if (!task.proof) throw new ApiError(400, "This task does not need a photo.");
  if (!taskApplies(task, user.equipment, user.roofAccess)) throw new ApiError(403, "That task does not apply to your home.");
  const repo = getRepository();
  const done = (await repo.listCompletions(user.id)).some((c) => c.taskId === taskId);
  if (done) throw new ApiError(409, "You have already completed this task.");
  const proof: TaskProof = { id: randomUUID(), userId: user.id, taskId, status: "pending", image, createdAt: now.toISOString() };
  const saved = await repo.addTaskProof(proof);
  if (!saved.ok) throw new ApiError(409, "You have already sent a photo for this task. It is waiting for review or was approved.");
  return { id: proof.id, status: "pending" };
}

export interface PendingProof {
  id: string;
  taskTitle: string;
  points: number;
  displayName: string;
  pincode: string;
  image: string;
  createdAt: string;
}

/** The review queue for administrators. Names are shown so a reviewer can tell who sent what, nothing more. */
export async function listPendingProofs(): Promise<PendingProof[]> {
  const repo = getRepository();
  const [pending, users] = await Promise.all([repo.listTaskProofs({ status: "pending" }), repo.listUsers()]);
  const byId = new Map(users.map((u) => [u.id, u]));
  return pending.flatMap((p) => {
    const user = byId.get(p.userId);
    const task = getTask(p.taskId);
    return user && task && p.image ? [{ id: p.id, taskTitle: task.title, points: task.points, displayName: user.displayName, pincode: user.pincode, image: p.image, createdAt: p.createdAt }] : [];
  });
}

/** Approving awards the task's points. Either way the photo is deleted straight away. */
export async function reviewProof(id: string, decision: "approved" | "rejected", now: Date = new Date()): Promise<{ id: string; status: "approved" | "rejected" }> {
  const repo = getRepository();
  const proof = (await repo.listTaskProofs()).find((p) => p.id === id);
  if (!proof) throw new ApiError(404, "That photo does not exist.");
  if (proof.status !== "pending") throw new ApiError(409, "That photo has already been reviewed.");
  if (decision === "approved") {
    const user = await repo.getUser(proof.userId);
    if (!user) throw new ApiError(404, "That household no longer exists.");
    // Award first: if this fails the photo stays in the queue instead of being approved without points.
    try {
      await completeTask(user, proof.taskId, now, { approvedProof: true });
    } catch (e) {
      // Already awarded some other way (409): approve the photo so it leaves the queue.
      if (!(e instanceof ApiError && e.status === 409)) throw e;
    }
  }
  await repo.reviewTaskProof(id, decision, now.toISOString());
  return { id, status: decision };
}

/** Households with an approved photo, shown as "Verified citizen" on the leaderboard. */
export async function photoVerifiedUserIds(): Promise<Set<string>> {
  const approved = await getRepository().listTaskProofs({ status: "approved" });
  return new Set(approved.map((p) => p.userId));
}
