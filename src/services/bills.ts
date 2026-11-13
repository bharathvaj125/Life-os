import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import type { BillProof, User } from "@/types";
import { ApiError } from "@/lib/api";
import { normaliseConsumerNo, validateBill } from "@/lib/bills/validate";
import { getRepository } from "@/lib/store";
import type { BillBody } from "@/lib/validation";
import { saveSnapshot } from "./footprint";

/**
 * Sample bills carry consumer numbers starting with 00000. Any account may scan them, so everyone can try the
 * feature with the sample files. Real consumer numbers never start this way.
 */
export const isSampleConsumer = (consumerNo: string) => normaliseConsumerNo(consumerNo).startsWith("00000");

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("Set SESSION_SECRET in the environment before running in production.");
  return "development-only-secret";
}

/**
 * A one-way fingerprint of the consumer number, keyed with the server secret. Consumer numbers are short digit
 * strings, so a plain hash could be guessed; the key makes that impractical. Sample numbers are tied to the
 * account, so several accounts can scan the same sample file.
 */
export function consumerFingerprint(consumerNo: string, userId: string): string {
  const digits = normaliseConsumerNo(consumerNo);
  const scope = isSampleConsumer(digits) ? `:${userId}` : "";
  return createHmac("sha256", secret()).update(`bill-consumer:${digits}${scope}`).digest("hex");
}

const TAKEN = "This bill has already been registered by another account. Each bill can only be used once.";

/**
 * Saves a month from a scanned bill. Every number is checked again here, because the browser could send anything.
 * The month is saved through the normal footprint path, so any rule that applies to monthly entries applies here too.
 */
export async function saveScannedBill(user: User, input: BillBody, now: Date = new Date()) {
  const check = validateBill({ consumerNo: input.consumerNo, month: input.period, previousReading: input.previousReading, currentReading: input.currentReading, multiplier: input.multiplier, units: input.units }, now);
  if (check.status !== "scanned") throw new ApiError(422, check.reasons.join(" "));

  const repo = getRepository();
  const consumerHash = consumerFingerprint(input.consumerNo, user.id);
  const owner = await repo.findBillProof(consumerHash, input.period);
  if (owner && owner.userId !== user.id) throw new ApiError(409, TAKEN);

  const proof: BillProof = {
    id: randomUUID(),
    userId: user.id,
    period: input.period,
    consumerHash,
    consumerLast4: normaliseConsumerNo(input.consumerNo).slice(-4),
    previousReading: input.previousReading,
    currentReading: input.currentReading,
    multiplier: input.multiplier,
    units: input.units,
    amountInr: input.amountInr,
    source: input.source,
    createdAt: now.toISOString(),
  };
  const saved = await repo.upsertBillProof(proof);
  if (!saved.ok) throw new ApiError(409, TAKEN);

  // Keep what the household already entered for that month (cooking gas, travel) and replace only the bill.
  const existing = (await repo.listSnapshots(user.id)).find((s) => s.period === input.period);
  const { snapshot, bonus } = await saveSnapshot(
    user.id,
    { period: input.period, electricityKwh: input.units, billAmountInr: input.amountInr ?? existing?.billAmountInr, lpgCylinders: existing?.lpgCylinders ?? 0, carKm: existing?.carKm ?? 0, bikeKm: existing?.bikeKm ?? 0, publicKm: existing?.publicKm ?? 0 },
    now,
  );
  return { snapshot, bonus, proof: { period: proof.period, consumerLast4: proof.consumerLast4, units: proof.units } };
}

/** Months whose saved units still match a scanned bill. Editing the units by hand removes the badge. */
export async function scannedPeriods(userId: string): Promise<Map<string, { last4: string }>> {
  const repo = getRepository();
  const [proofs, snapshots] = await Promise.all([repo.listBillProofs(userId), repo.listSnapshots(userId)]);
  const out = new Map<string, { last4: string }>();
  for (const p of proofs) {
    const snap = snapshots.find((s) => s.period === p.period);
    if (snap && Math.abs(snap.electricityKwh - p.units) < 0.5) out.set(p.period, { last4: p.consumerLast4 });
  }
  return out;
}
