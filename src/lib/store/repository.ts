import type { Challenge, Completion, Membership, Snapshot, User } from "@/types";

/**
 * Persistence boundary. Services depend only on this interface, so the local JSON store used for
 * development and demos can be swapped for Supabase PostgreSQL without touching business logic.
 */
export interface Repository {
  createUser(user: User): Promise<User>;
  getUser(id: string): Promise<User | null>;
  updateUser(id: string, patch: Partial<Pick<User, "leaderboardOptIn" | "displayName">>): Promise<User | null>;
  listUsers(): Promise<User[]>;

  /** One snapshot per user and period: saving again for the same month replaces it. */
  upsertSnapshot(snapshot: Snapshot): Promise<Snapshot>;
  listSnapshots(userId?: string): Promise<Snapshot[]>;

  /** Idempotent on (userId, dedupeKey): a duplicate returns created=false with the original row. */
  addCompletion(completion: Completion): Promise<{ created: boolean; completion: Completion }>;
  listCompletions(userId?: string): Promise<Completion[]>;

  listChallenges(): Promise<Challenge[]>;
  joinChallenge(membership: Membership): Promise<void>;
  listMemberships(): Promise<Membership[]>;
}
