import "server-only";
import type { User } from "@/types";
import { getRepository } from "@/lib/store";
import { demoUserId, type DemoKey } from "@/features/demo/accounts";
import { buildDemoAccount } from "@/lib/store/demo-accounts";
import { loadDemoData } from "./admin";

/**
 * Creates a demo account the first time someone chooses it, then reuses it. Demo accounts are shared
 * sandboxes: handy for trying the app, labelled "(demo)" everywhere, and never a real household.
 */
export async function ensureDemoAccount(key: DemoKey, now: Date = new Date()): Promise<User> {
  const repo = getRepository();
  const existing = await repo.getUser(demoUserId(key));
  if (existing) {
    // Demo accounts made earlier keep their data but pick up the current display name.
    const current = buildDemoAccount(key, now).user.displayName;
    return existing.displayName === current ? existing : ((await repo.updateUser(existing.id, { displayName: current })) ?? existing);
  }

  // The first demo visit on a fresh database also loads the sample households and vendors, so nothing looks empty.
  await loadDemoData().catch(() => undefined);

  const bundle = buildDemoAccount(key, now);
  try {
    await repo.createUser(bundle.user);
    for (const s of bundle.snapshots) await repo.upsertSnapshot(s);
    for (const c of bundle.completions) await repo.addCompletion(c);
    const known = new Set((await repo.listChallenges()).map((c) => c.id));
    for (const challengeId of bundle.challengeIds.filter((id) => known.has(id))) await repo.joinChallenge({ challengeId, userId: bundle.user.id, joinedAt: bundle.user.createdAt });
    if (bundle.vendor) await repo.addVendor(bundle.vendor);
  } catch (e) {
    // Two visitors choosing the same demo at once: the other request created it first, so use that one.
    const created = await repo.getUser(demoUserId(key));
    if (created) return created;
    throw e;
  }
  return bundle.user;
}
