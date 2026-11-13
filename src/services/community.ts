import "server-only";
import type { User } from "@/types";
import { challengeProgress, levelFor } from "@/lib/calculations/gamification";
import { regionLabel, regionOf } from "@/lib/calculations/aggregate";
import { istDate } from "@/lib/dates";
import { getRepository } from "@/lib/store";
import { ApiError } from "@/lib/api";
import { completeTask } from "./actions";

/** The first three sample households of each area stand in for bill-scanned ones. The tier is not stored for them in the database. */
const sampleBillScanned = /^demo-\d{3}-[123]$/;

export interface LeaderRow {
  rank: number;
  displayName: string;
  region: string;
  pincodePrefix: string;
  points: number;
  level: string;
  isYou: boolean;
  isDemo: boolean;
  verificationTier: "self_reported" | "bill_verified" | "smart_meter";
}

export async function getCommunityView(user: User, now: Date = new Date()) {
  const repo = getRepository();
  const [challenges, memberships, completions, everyone, proofs, snapshots] = await Promise.all([repo.listChallenges(), repo.listMemberships(), repo.listCompletions(), repo.listUsers(), repo.listBillProofs(), repo.listSnapshots()]);
  // Installers and administrators are not households, so they never appear on leaderboards.
  const users = everyone.filter((u) => u.role === "citizen");
  const today = istDate(now);
  const prefix = regionOf(user.pincode);
  const joined = new Set(memberships.filter((m) => m.userId === user.id).map((m) => m.challengeId));

  const visible = challenges
    .filter((c) => c.endsOn >= today && (c.regionPrefix === null || c.regionPrefix === prefix))
    .map((c) => ({ ...c, progress: challengeProgress(c, memberships, completions), joined: joined.has(c.id) }));

  const points = new Map<string, number>();
  for (const c of completions) points.set(c.userId, (points.get(c.userId) ?? 0) + c.points);

  // A household is "bill-scanned" when a scanned bill still matches the units saved for that month. Nobody is
  // "smart meter" yet: that tier is planned. Sample households carry a tier of their own so the board has examples.
  const kwhByMonth = new Map(snapshots.map((x) => [`${x.userId}:${x.period}`, x.electricityKwh]));
  const scanned = new Set(proofs.filter((p) => Math.abs((kwhByMonth.get(`${p.userId}:${p.period}`) ?? -1) - p.units) < 0.5).map((p) => p.userId));
  const tierOf = (u: User): "self_reported" | "bill_verified" | "smart_meter" => (scanned.has(u.id) ? "bill_verified" : u.verificationTier ?? (sampleBillScanned.test(u.id) ? "bill_verified" : "self_reported"));

  // Only people who opted in appear, plus you, so you can always see your own standing.
  const board = (scope: (u: User) => boolean): LeaderRow[] =>
    users
      .filter((u) => (u.leaderboardOptIn || u.id === user.id) && scope(u))
      .map((u) => ({ u, p: points.get(u.id) ?? 0 }))
      .sort((a, b) => b.p - a.p || a.u.displayName.localeCompare(b.u.displayName))
      .map(({ u, p }, i) => ({
        rank: i + 1,
        displayName: u.displayName,
        region: regionLabel(regionOf(u.pincode)),
        pincodePrefix: regionOf(u.pincode),
        points: p,
        level: levelFor(p).name,
        isYou: u.id === user.id,
        isDemo: u.isDemo,
        verificationTier: tierOf(u),
      }));

  const trim = (rows: LeaderRow[]) => {
    const top = rows.slice(0, 15);
    const you = rows.find((r) => r.isYou);
    return you && !top.includes(you) ? [...top, you] : top;
  };

  const statewideRows = board(() => true);
  const localRows = board((u) => regionOf(u.pincode) === prefix);

  return {
    challenges: visible,
    userPrefix: prefix,
    userRegion: regionLabel(prefix),
    local: { label: regionLabel(prefix), rows: trim(localRows) },
    statewide: { rows: trim(statewideRows) },
    allRows: statewideRows, // Full list so client can filter by any district or tier seamlessly
    includesDemo: users.some((u) => u.isDemo),
  };
}

export async function joinChallenge(user: User, challengeId: string) {
  const repo = getRepository();
  const challenge = (await repo.listChallenges()).find((c) => c.id === challengeId);
  if (!challenge) throw new ApiError(404, "That challenge does not exist.");
  if (challenge.regionPrefix && challenge.regionPrefix !== regionOf(user.pincode)) throw new ApiError(403, `This challenge is for ${challenge.region} residents.`);
  await repo.joinChallenge({ challengeId, userId: user.id, joinedAt: new Date().toISOString() });
  // Joining is itself a one-time task; ignore it if already rewarded.
  await completeTask(user, "join-challenge").catch((e) => {
    if (!(e instanceof ApiError && e.status === 409)) throw e;
  });
}
