import "server-only";
import { aggregateByRegion } from "@/lib/calculations/aggregate";
import { getRepository } from "@/lib/store";
import { buildSeed } from "@/lib/store/seed";
import { istDate } from "@/lib/dates";

/** Region-level numbers only, with groups smaller than the privacy threshold suppressed. */
export async function getAdminSummary() {
  const repo = getRepository();
  const [users, snapshots, completions] = await Promise.all([repo.listUsers(), repo.listSnapshots(), repo.listCompletions()]);
  const summary = aggregateByRegion(users, snapshots, completions);
  const latestPeriod = snapshots.reduce((max, s) => (s.period > max ? s.period : max), "");
  return { ...summary, asOf: istDate(), latestPeriod: latestPeriod || null };
}

/**
 * Loads the clearly labelled demo households (and starter challenges) through the repository, so a
 * fresh Supabase project can show the community and admin views. Safe to call repeatedly.
 */
export async function loadDemoData(): Promise<{ added: number }> {
  const repo = getRepository();
  const seed = buildSeed(new Date());
  const existing = new Set((await repo.listUsers()).map((u) => u.id));
  const fresh = seed.users.filter((u) => !existing.has(u.id));
  const freshIds = new Set(fresh.map((u) => u.id));
  for (const u of fresh) await repo.createUser(u);
  for (const s of seed.snapshots.filter((s) => freshIds.has(s.userId))) await repo.upsertSnapshot(s);
  for (const c of seed.completions.filter((c) => freshIds.has(c.userId))) await repo.addCompletion(c);
  for (const m of seed.memberships.filter((m) => freshIds.has(m.userId))) await repo.joinChallenge(m);
  const knownVendors = new Set((await repo.listVendors()).map((v) => v.id));
  for (const v of seed.vendors.filter((v) => !knownVendors.has(v.id))) await repo.addVendor(v);
  return { added: fresh.length };
}
