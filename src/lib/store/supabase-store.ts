import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Challenge, Completion, Membership, Snapshot, User } from "@/types";
import type { Repository } from "./repository";

/**
 * Supabase PostgreSQL adapter. It uses the service-role key, which exists only on the server: sessions
 * are our own signed cookies, so every authorisation decision is made in the service layer. The tables
 * have row level security switched on with no public policies, so the browser-facing publishable key
 * can read and write nothing. Schema: supabase/migrations/.
 */
let client: SupabaseClient | undefined;
const db = () => (client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false, autoRefreshToken: false } }));

const PAGE = 1000;

type Row = Record<string, unknown>;

/** Supabase returns at most 1000 rows per request, so read in pages. */
async function fetchAll(table: string, eq?: [column: string, value: string]): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    let query = db().from(table).select("*");
    if (eq) query = query.eq(eq[0], eq[1]);
    const { data, error } = await query.range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

const toUser = (r: Row): User => ({ id: r.id as string, displayName: r.display_name as string, pincode: r.pincode as string, householdSize: r.household_size as number, leaderboardOptIn: r.leaderboard_opt_in as boolean, isDemo: r.is_demo as boolean, createdAt: r.created_at as string });
const fromUser = (u: User) => ({ id: u.id, display_name: u.displayName, pincode: u.pincode, household_size: u.householdSize, leaderboard_opt_in: u.leaderboardOptIn, is_demo: u.isDemo, created_at: u.createdAt });

const toSnapshot = (r: Row): Snapshot => ({ id: r.id as string, userId: r.user_id as string, period: r.period as string, electricityKwh: Number(r.electricity_kwh), billAmountInr: r.bill_amount_inr == null ? undefined : Number(r.bill_amount_inr), lpgCylinders: Number(r.lpg_cylinders), carKm: Number(r.car_km), bikeKm: Number(r.bike_km), publicKm: Number(r.public_km), electricityKg: Number(r.electricity_kg), commuteKg: Number(r.commute_kg), lpgKg: Number(r.lpg_kg), totalKg: Number(r.total_kg), factorVersion: r.factor_version as string, createdAt: r.created_at as string });
const fromSnapshot = (s: Snapshot) => ({ id: s.id, user_id: s.userId, period: s.period, electricity_kwh: s.electricityKwh, bill_amount_inr: s.billAmountInr ?? null, lpg_cylinders: s.lpgCylinders, car_km: s.carKm, bike_km: s.bikeKm, public_km: s.publicKm, electricity_kg: s.electricityKg, commute_kg: s.commuteKg, lpg_kg: s.lpgKg, total_kg: s.totalKg, factor_version: s.factorVersion, created_at: s.createdAt });

const toCompletion = (r: Row): Completion => ({ id: r.id as string, userId: r.user_id as string, taskId: r.task_id as string, dedupeKey: r.dedupe_key as string, completedOn: r.completed_on as string, points: r.points as number, impactKg: Number(r.impact_kg), createdAt: r.created_at as string });
const fromCompletion = (c: Completion) => ({ id: c.id, user_id: c.userId, task_id: c.taskId, dedupe_key: c.dedupeKey, completed_on: c.completedOn, points: c.points, impact_kg: c.impactKg, created_at: c.createdAt });

const toChallenge = (r: Row): Challenge => ({ id: r.id as string, title: r.title as string, description: r.description as string, region: r.region as string, regionPrefix: (r.region_prefix as string | null) ?? null, metric: r.metric as Challenge["metric"], target: Number(r.target), startsOn: r.starts_on as string, endsOn: r.ends_on as string });

export function supabaseStore(): Repository {
  return {
    async createUser(user) {
      const { error } = await db().from("app_users").insert(fromUser(user));
      if (error) throw error;
      return user;
    },
    async getUser(id) {
      const { data, error } = await db().from("app_users").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? toUser(data) : null;
    },
    async updateUser(id, patch) {
      const row: Row = {};
      if (patch.leaderboardOptIn !== undefined) row.leaderboard_opt_in = patch.leaderboardOptIn;
      if (patch.displayName !== undefined) row.display_name = patch.displayName;
      const { data, error } = await db().from("app_users").update(row).eq("id", id).select("*").maybeSingle();
      if (error) throw error;
      return data ? toUser(data) : null;
    },
    async listUsers() {
      return (await fetchAll("app_users")).map(toUser);
    },

    async upsertSnapshot(snapshot) {
      const { data, error } = await db().from("footprint_snapshots").upsert(fromSnapshot(snapshot), { onConflict: "user_id,period" }).select("*").single();
      if (error) throw error;
      return toSnapshot(data);
    },
    async listSnapshots(userId) {
      return (await fetchAll("footprint_snapshots", userId ? ["user_id", userId] : undefined)).map(toSnapshot);
    },

    async addCompletion(completion) {
      const { error } = await db().from("task_completions").insert(fromCompletion(completion));
      if (!error) return { created: true, completion };
      if (error.code !== "23505") throw error;
      const { data, error: readError } = await db().from("task_completions").select("*").eq("user_id", completion.userId).eq("dedupe_key", completion.dedupeKey).single();
      if (readError) throw readError;
      return { created: false, completion: toCompletion(data) };
    },
    async listCompletions(userId) {
      return (await fetchAll("task_completions", userId ? ["user_id", userId] : undefined)).map(toCompletion);
    },

    async listChallenges() {
      return (await fetchAll("challenges")).map(toChallenge);
    },
    async joinChallenge(m: Membership) {
      const { error } = await db().from("challenge_members").upsert({ challenge_id: m.challengeId, user_id: m.userId, joined_at: m.joinedAt }, { onConflict: "challenge_id,user_id", ignoreDuplicates: true });
      if (error) throw error;
    },
    async listMemberships() {
      return (await fetchAll("challenge_members")).map((r): Membership => ({ challengeId: r.challenge_id as string, userId: r.user_id as string, joinedAt: r.joined_at as string }));
    },
  };
}
