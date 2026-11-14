import { BILL_SAVINGS_TASK_ID } from "./bill-savings";
import { getTask } from "@/features/gamification/tasks";

/**
 * Leaderboards rank what we can check more highly than what we cannot. Points a household claims stay as they are
 * (they drive levels and streaks), but the ranking score weighs each completion by the evidence behind it:
 *
 *  - an administrator-approved photo, or something the app itself saw (joining a goal, running the solar estimate): full weight
 *  - a saving taken from a bill that was scanned and checks out: full weight
 *  - a tick-box habit nobody can check: a quarter of its points, or half once the household's bill has been scanned
 */
export const SELF_CLAIM_WEIGHT = 0.25;
export const SELF_CLAIM_WEIGHT_BILL_SCANNED = 0.5;
/** A bill-based saving taken from figures that were only typed in. */
export const TYPED_BILL_WEIGHT = 0.4;

/** Tasks the app itself can see happen, so no one needs to be believed. */
const SYSTEM_SEEN = new Set(["join-challenge", "solar-estimate"]);

export type Evidence = "photo" | "system" | "bill" | "self";

export function evidenceOf(taskId: string): Evidence {
  if (taskId === BILL_SAVINGS_TASK_ID) return "bill";
  if (getTask(taskId)?.proof) return "photo";
  if (SYSTEM_SEEN.has(taskId)) return "system";
  return "self";
}

export function rankingWeight(taskId: string, billScanned: boolean): number {
  switch (evidenceOf(taskId)) {
    case "photo":
    case "system":
      return 1;
    case "bill":
      return billScanned ? 1 : TYPED_BILL_WEIGHT;
    default:
      return billScanned ? SELF_CLAIM_WEIGHT_BILL_SCANNED : SELF_CLAIM_WEIGHT;
  }
}

export interface RankingScore {
  /** What the leaderboard sorts by. */
  score: number;
  /** Points the household claimed, before weighting. */
  claimed: number;
  /** Claimed points that were fully backed by evidence. */
  verified: number;
  /** Claimed points that were self-reported or only partly backed. */
  selfReported: number;
}

export function rankingScore(completions: { taskId: string; points: number }[], billScanned: boolean): RankingScore {
  let score = 0;
  let verified = 0;
  let selfReported = 0;
  for (const c of completions) {
    const w = rankingWeight(c.taskId, billScanned);
    score += c.points * w;
    if (w === 1) verified += c.points;
    else selfReported += c.points;
  }
  return { score: Math.round(score), claimed: verified + selfReported, verified, selfReported };
}

export interface DistrictInput {
  prefix: string;
  score: number;
  verified: number;
  claimed: number;
}

export interface DistrictScore {
  prefix: string;
  households: number;
  totalScore: number;
  /** Average score per household, so a big district does not win just by being big. */
  avgScore: number;
  /** Share of the district's claimed points that were backed by evidence, 0-100. */
  verifiedShare: number;
  /** Null when the district does not have enough households to be ranked fairly yet. */
  rank: number | null;
}

/** A district needs this many opted-in households before it is ranked, so one keen household cannot top the table. */
export const MIN_DISTRICT_HOUSEHOLDS = 3;

export function rankDistricts(rows: DistrictInput[]): DistrictScore[] {
  const groups = new Map<string, DistrictInput[]>();
  for (const r of rows) groups.set(r.prefix, [...(groups.get(r.prefix) ?? []), r]);
  const scored = [...groups.entries()].map(([prefix, members]) => {
    const totalScore = members.reduce((s, m) => s + m.score, 0);
    const claimed = members.reduce((s, m) => s + m.claimed, 0);
    const verified = members.reduce((s, m) => s + m.verified, 0);
    return {
      prefix,
      households: members.length,
      totalScore,
      avgScore: Math.round((totalScore / members.length) * 10) / 10,
      verifiedShare: claimed ? Math.round((verified / claimed) * 100) : 0,
      rank: null as number | null,
    };
  });
  const ranked = scored.filter((d) => d.households >= MIN_DISTRICT_HOUSEHOLDS).sort((a, b) => b.avgScore - a.avgScore || b.totalScore - a.totalScore || a.prefix.localeCompare(b.prefix));
  ranked.forEach((d, i) => (d.rank = i + 1));
  const rest = scored.filter((d) => d.households < MIN_DISTRICT_HOUSEHOLDS).sort((a, b) => b.households - a.households || a.prefix.localeCompare(b.prefix));
  return [...ranked, ...rest];
}
