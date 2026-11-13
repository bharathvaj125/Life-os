import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BillProof, Challenge, Completion, Membership, Snapshot, User, Vendor } from "@/types";
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

const toUser = (r: Row): User => ({ id: r.id as string, role: ((r.role as User["role"] | null) ?? "citizen"), homeType: (r.home_type as User["homeType"] | null) ?? undefined, ownership: (r.ownership as User["ownership"] | null) ?? undefined, roofAccess: (r.roof_access as User["roofAccess"] | null) ?? undefined, equipment: (r.equipment as User["equipment"] | null) ?? undefined, displayName: r.display_name as string, pincode: r.pincode as string, householdSize: r.household_size as number, leaderboardOptIn: r.leaderboard_opt_in as boolean, isDemo: r.is_demo as boolean, email: (r.email as string | null) ?? undefined, createdAt: r.created_at as string });
const fromUser = (u: User) => ({ id: u.id, role: u.role, home_type: u.homeType ?? null, ownership: u.ownership ?? null, roof_access: u.roofAccess ?? null, equipment: u.equipment ?? null, display_name: u.displayName, pincode: u.pincode, household_size: u.householdSize, leaderboard_opt_in: u.leaderboardOptIn, is_demo: u.isDemo, created_at: u.createdAt });

const toSnapshot = (r: Row): Snapshot => ({ id: r.id as string, userId: r.user_id as string, period: r.period as string, electricityKwh: Number(r.electricity_kwh), billAmountInr: r.bill_amount_inr == null ? undefined : Number(r.bill_amount_inr), lpgCylinders: Number(r.lpg_cylinders), carKm: Number(r.car_km), bikeKm: Number(r.bike_km), publicKm: Number(r.public_km), electricityKg: Number(r.electricity_kg), commuteKg: Number(r.commute_kg), lpgKg: Number(r.lpg_kg), totalKg: Number(r.total_kg), factorVersion: r.factor_version as string, createdAt: r.created_at as string });
const fromSnapshot = (s: Snapshot) => ({ id: s.id, user_id: s.userId, period: s.period, electricity_kwh: s.electricityKwh, bill_amount_inr: s.billAmountInr ?? null, lpg_cylinders: s.lpgCylinders, car_km: s.carKm, bike_km: s.bikeKm, public_km: s.publicKm, electricity_kg: s.electricityKg, commute_kg: s.commuteKg, lpg_kg: s.lpgKg, total_kg: s.totalKg, factor_version: s.factorVersion, created_at: s.createdAt });

const toCompletion = (r: Row): Completion => ({ id: r.id as string, userId: r.user_id as string, taskId: r.task_id as string, dedupeKey: r.dedupe_key as string, completedOn: r.completed_on as string, points: r.points as number, impactKg: Number(r.impact_kg), createdAt: r.created_at as string });
const fromCompletion = (c: Completion) => ({ id: c.id, user_id: c.userId, task_id: c.taskId, dedupe_key: c.dedupeKey, completed_on: c.completedOn, points: c.points, impact_kg: c.impactKg, created_at: c.createdAt });

const toChallenge = (r: Row): Challenge => ({ id: r.id as string, title: r.title as string, description: r.description as string, region: r.region as string, regionPrefix: (r.region_prefix as string | null) ?? null, metric: r.metric as Challenge["metric"], target: Number(r.target), startsOn: r.starts_on as string, endsOn: r.ends_on as string });

const toVendor = (r: Row): Vendor => ({ id: r.id as string, name: r.name as string, city: r.city as string, pincode: r.pincode as string, services: r.services as Vendor["services"], phone: (r.phone as string | null) ?? undefined, website: (r.website as string | null) ?? undefined, empanelmentClaim: (r.empanelment_claim as string | null) ?? undefined, status: r.status as Vendor["status"], isSample: r.is_sample as boolean, ownerUserId: (r.owner_user_id as string | null) ?? undefined, createdAt: r.created_at as string });
const fromVendor = (v: Vendor) => ({ id: v.id, name: v.name, city: v.city, pincode: v.pincode, services: v.services, phone: v.phone ?? null, website: v.website ?? null, empanelment_claim: v.empanelmentClaim ?? null, status: v.status, is_sample: v.isSample, owner_user_id: v.ownerUserId ?? null, created_at: v.createdAt });

const toProof = (r: Row): BillProof => ({ id: r.id as string, userId: r.user_id as string, period: r.period as string, consumerHash: r.consumer_hash as string, consumerLast4: r.consumer_last4 as string, previousReading: Number(r.previous_reading), currentReading: Number(r.current_reading), multiplier: Number(r.multiplier), units: Number(r.units), amountInr: r.amount_inr == null ? undefined : Number(r.amount_inr), source: r.source as BillProof["source"], createdAt: r.created_at as string });
const fromProof = (p: BillProof) => ({ id: p.id, user_id: p.userId, period: p.period, consumer_hash: p.consumerHash, consumer_last4: p.consumerLast4, previous_reading: p.previousReading, current_reading: p.currentReading, multiplier: p.multiplier, units: p.units, amount_inr: p.amountInr ?? null, source: p.source, created_at: p.createdAt });

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
      if (patch.pincode !== undefined) row.pincode = patch.pincode;
      if (patch.householdSize !== undefined) row.household_size = patch.householdSize;
      if (patch.homeType !== undefined) row.home_type = patch.homeType;
      if (patch.ownership !== undefined) row.ownership = patch.ownership;
      if (patch.roofAccess !== undefined) row.roof_access = patch.roofAccess;
      if (patch.equipment !== undefined) row.equipment = patch.equipment;
      const { data, error } = await db().from("app_users").update(row).eq("id", id).select("*").maybeSingle();
      if (error) throw error;
      return data ? toUser(data) : null;
    },
    async listUsers() {
      return (await fetchAll("app_users")).map(toUser);
    },

    async setCredentials(userId, email, passwordHash) {
      const { data, error } = await db().from("app_users").update({ email, password_hash: passwordHash }).eq("id", userId).select("id").maybeSingle();
      if (error) {
        if (error.code === "23505") return false;
        throw error;
      }
      return Boolean(data);
    },
    async getCredentials(email) {
      const { data, error } = await db().from("app_users").select("id, email, password_hash").eq("email", email).maybeSingle();
      if (error) throw error;
      return data && data.password_hash ? { userId: data.id as string, email: data.email as string, passwordHash: data.password_hash as string } : null;
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

    async upsertBillProof(proof) {
      const { error } = await db().from("bill_proofs").upsert(fromProof(proof), { onConflict: "user_id,period" });
      if (!error) return { ok: true as const };
      if (error.code === "23505") return { ok: false as const, reason: "duplicate" as const };
      throw error;
    },
    async listBillProofs(userId) {
      return (await fetchAll("bill_proofs", userId ? ["user_id", userId] : undefined)).map(toProof);
    },
    async findBillProof(consumerHash, period) {
      const { data, error } = await db().from("bill_proofs").select("*").eq("consumer_hash", consumerHash).eq("period", period).maybeSingle();
      if (error) throw error;
      return data ? toProof(data) : null;
    },

    async listVendors() {
      return (await fetchAll("vendors")).map(toVendor);
    },
    async addVendor(vendor) {
      const { error } = await db().from("vendors").insert(fromVendor(vendor));
      if (error) throw error;
      return vendor;
    },
    async setVendorStatus(id, status) {
      const { data, error } = await db().from("vendors").update({ status }).eq("id", id).select("*").maybeSingle();
      if (error) throw error;
      return data ? toVendor(data) : null;
    },
    async updateVendor(id, patch, status) {
      const row: Row = { status };
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.city !== undefined) row.city = patch.city;
      if (patch.pincode !== undefined) row.pincode = patch.pincode;
      if (patch.services !== undefined) row.services = patch.services;
      if ("phone" in patch) row.phone = patch.phone ?? null;
      if ("website" in patch) row.website = patch.website ?? null;
      if ("empanelmentClaim" in patch) row.empanelment_claim = patch.empanelmentClaim ?? null;
      const { data, error } = await db().from("vendors").update(row).eq("id", id).select("*").maybeSingle();
      if (error) throw error;
      return data ? toVendor(data) : null;
    },
  };
}
