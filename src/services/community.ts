import "server-only";
import type { User } from "@/types";
import { challengeProgress, levelFor } from "@/lib/calculations/gamification";
import { regionLabel, regionOf } from "@/lib/calculations/aggregate";
import { istDate } from "@/lib/dates";
import { getRepository } from "@/lib/store";
import { ApiError } from "@/lib/api";
import { completeTask } from "./actions";
import { rankDistricts, rankingScore, type DistrictScore } from "@/lib/calculations/ranking";
import { photoVerifiedUserIds } from "./proofs";

/** The first three sample households of each area stand in for bill-scanned ones. The tier is not stored for them in the database. */
const sampleBillScanned = /^demo-\d{3}-[123]$/;

export interface LeaderRow {
  rank: number;
  displayName: string;
  region: string;
  pincodePrefix: string;
  /** The ranking score: claimed points weighed by how well each is backed by evidence. */
  points: number;
  /** Points the household claimed, before weighting. */
  claimed: number;
  /** Claimed points fully backed by evidence (approved photos, things the app saw, scanned bills). */
  verifiedPoints: number;
  /** Claimed points nobody could check, counted at a lower weight. */
  selfPoints: number;
  level: string;
  isYou: boolean;
  isDemo: boolean;
  verificationTier: "self_reported" | "bill_verified" | "smart_meter";
  /** An administrator approved a photo for this household. */
  photoVerified: boolean;
}

export async function getCommunityView(user: User, now: Date = new Date()) {
  const repo = getRepository();
  const [challenges, memberships, completions, everyone, proofs, snapshots, photoVerified] = await Promise.all([repo.listChallenges(), repo.listMemberships(), repo.listCompletions(), repo.listUsers(), repo.listBillProofs(), repo.listSnapshots(), photoVerifiedUserIds()]);
  // Installers and administrators are not households, so they never appear on leaderboards.
  const users = everyone.filter((u) => u.role === "citizen");
  const today = istDate(now);
  const prefix = regionOf(user.pincode);
  const joined = new Set(memberships.filter((m) => m.userId === user.id).map((m) => m.challengeId));

  const visible = challenges
    .filter((c) => c.endsOn >= today && (c.regionPrefix === null || c.regionPrefix === prefix))
    .map((c) => ({ ...c, progress: challengeProgress(c, memberships, completions), joined: joined.has(c.id) }));

  const claimedBy = new Map<string, number>();
  const byUser = new Map<string, { taskId: string; points: number }[]>();
  for (const c of completions) {
    claimedBy.set(c.userId, (claimedBy.get(c.userId) ?? 0) + c.points);
    byUser.set(c.userId, [...(byUser.get(c.userId) ?? []), { taskId: c.taskId, points: c.points }]);
  }

  // A household is "bill-scanned" when a scanned bill still matches the units saved for that month. Nobody is
  // "smart meter" yet: that tier is planned. Sample households carry a tier of their own so the board has examples.
  const kwhByMonth = new Map(snapshots.map((x) => [`${x.userId}:${x.period}`, x.electricityKwh]));
  const scanned = new Set(proofs.filter((p) => Math.abs((kwhByMonth.get(`${p.userId}:${p.period}`) ?? -1) - p.units) < 0.5).map((p) => p.userId));
  const tierOf = (u: User): "self_reported" | "bill_verified" | "smart_meter" => (scanned.has(u.id) ? "bill_verified" : u.verificationTier ?? (sampleBillScanned.test(u.id) ? "bill_verified" : "self_reported"));

  // What people claim is weighed by how well it is backed, so a household with photos and a scanned bill outranks one that only ticks boxes.
  const scoreOf = (u: User) => rankingScore(byUser.get(u.id) ?? [], tierOf(u) !== "self_reported");

  // Only people who opted in appear, plus you, so you can always see your own standing.
  const board = (scope: (u: User) => boolean): LeaderRow[] =>
    users
      .filter((u) => (u.leaderboardOptIn || u.id === user.id) && scope(u))
      .map((u) => ({ u, r: scoreOf(u) }))
      .sort((a, b) => b.r.score - a.r.score || b.r.verified - a.r.verified || a.u.displayName.localeCompare(b.u.displayName))
      .map(({ u, r }, i) => ({
        rank: i + 1,
        displayName: u.displayName,
        region: regionLabel(regionOf(u.pincode)),
        pincodePrefix: regionOf(u.pincode),
        points: r.score,
        claimed: r.claimed,
        verifiedPoints: r.verified,
        selfPoints: r.selfReported,
        level: levelFor(claimedBy.get(u.id) ?? 0).name,
        isYou: u.id === user.id,
        isDemo: u.isDemo,
        verificationTier: tierOf(u),
        photoVerified: photoVerified.has(u.id),
      }));

  const trim = (rows: LeaderRow[]) => {
    const top = rows.slice(0, 15);
    const you = rows.find((r) => r.isYou);
    return you && !top.includes(you) ? [...top, you] : top;
  };

  const statewideRows = board(() => true);
  const localRows = board((u) => regionOf(u.pincode) === prefix);

  // Districts are ranked on opted-in households only, by average score so size does not decide it.
  const districts: (DistrictScore & { name: string; isYours: boolean })[] = rankDistricts(
    users.filter((u) => u.leaderboardOptIn).map((u) => ({ prefix: regionOf(u.pincode), ...(({ score, verified, claimed }) => ({ score, verified, claimed }))(scoreOf(u)) }))
  ).map((d) => ({ ...d, name: regionLabel(d.prefix), isYours: d.prefix === prefix }));

  return {
    districts,
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
