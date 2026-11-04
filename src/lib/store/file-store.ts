import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { StoreData } from "@/types";
import type { Repository } from "./repository";
import { buildSeed } from "./seed";

const dir = () => process.env.LIFEOS_DATA_DIR ?? (process.env.VERCEL ? os.tmpdir() : path.join(process.cwd(), ".data"));
const file = () => path.join(dir(), "lifeos.json");

// Held on globalThis so every route bundle in the same server process shares one copy and one write queue.
const g = globalThis as typeof globalThis & { __lifeosData?: Promise<StoreData>; __lifeosQueue?: Promise<unknown> };

async function persist(data: StoreData) {
  await fs.mkdir(dir(), { recursive: true });
  await fs.writeFile(file(), JSON.stringify(data));
}

function load(): Promise<StoreData> {
  g.__lifeosData ??= (async () => {
    try {
      return JSON.parse(await fs.readFile(file(), "utf8")) as StoreData;
    } catch {
      const seeded = buildSeed(new Date());
      await persist(seeded);
      return seeded;
    }
  })();
  return g.__lifeosData;
}

/** Serialises writes so concurrent requests cannot interleave a read-modify-write. */
function mutate<T>(fn: (data: StoreData) => T): Promise<T> {
  const run = (g.__lifeosQueue ?? Promise.resolve()).then(async () => {
    const data = await load();
    const result = fn(data);
    await persist(data);
    return result;
  });
  g.__lifeosQueue = run.catch(() => undefined);
  return run;
}

export const fileStore: Repository = {
  async createUser(user) {
    return mutate((d) => { d.users.push(user); return user; });
  },
  async getUser(id) {
    return (await load()).users.find((u) => u.id === id) ?? null;
  },
  async updateUser(id, patch) {
    return mutate((d) => {
      const user = d.users.find((u) => u.id === id);
      if (!user) return null;
      Object.assign(user, patch);
      return user;
    });
  },
  async listUsers() {
    return (await load()).users;
  },

  async upsertSnapshot(snapshot) {
    return mutate((d) => {
      const i = d.snapshots.findIndex((s) => s.userId === snapshot.userId && s.period === snapshot.period);
      if (i >= 0) d.snapshots[i] = { ...snapshot, id: d.snapshots[i].id, createdAt: d.snapshots[i].createdAt };
      else d.snapshots.push(snapshot);
      return i >= 0 ? d.snapshots[i] : snapshot;
    });
  },
  async listSnapshots(userId) {
    const all = (await load()).snapshots;
    return userId ? all.filter((s) => s.userId === userId) : all;
  },

  async addCompletion(completion) {
    return mutate((d) => {
      const existing = d.completions.find((c) => c.userId === completion.userId && c.dedupeKey === completion.dedupeKey);
      if (existing) return { created: false, completion: existing };
      d.completions.push(completion);
      return { created: true, completion };
    });
  },
  async listCompletions(userId) {
    const all = (await load()).completions;
    return userId ? all.filter((c) => c.userId === userId) : all;
  },

  async listChallenges() {
    return (await load()).challenges;
  },
  async joinChallenge(membership) {
    await mutate((d) => {
      if (!d.memberships.some((m) => m.challengeId === membership.challengeId && m.userId === membership.userId)) d.memberships.push(membership);
    });
  },
  async listMemberships() {
    return (await load()).memberships;
  },
};
