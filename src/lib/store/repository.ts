import type { BillProof, Challenge, Completion, Credentials, Membership, Snapshot, User, Vendor, VendorStatus } from "@/types";

/**
 * Persistence boundary. Services depend only on this interface, so the local JSON store used for
 * development and demos can be swapped for Supabase PostgreSQL without touching business logic.
 */
export interface Repository {
  createUser(user: User): Promise<User>;
  getUser(id: string): Promise<User | null>;
  updateUser(id: string, patch: Partial<Pick<User, "leaderboardOptIn" | "displayName" | "pincode" | "householdSize" | "homeType" | "ownership" | "roofAccess" | "equipment">>): Promise<User | null>;
  listUsers(): Promise<User[]>;

  /** Adds or replaces the sign-in details of a user. Returns false when the email already belongs to someone else. Emails are stored lower-case. */
  setCredentials(userId: string, email: string, passwordHash: string): Promise<boolean>;
  getCredentials(email: string): Promise<Credentials | null>;

  /** One snapshot per user and period: saving again for the same month replaces it. */
  upsertSnapshot(snapshot: Snapshot): Promise<Snapshot>;
  listSnapshots(userId?: string): Promise<Snapshot[]>;

  /** Idempotent on (userId, dedupeKey): a duplicate returns created=false with the original row. */
  addCompletion(completion: Completion): Promise<{ created: boolean; completion: Completion }>;
  listCompletions(userId?: string): Promise<Completion[]>;

  listChallenges(): Promise<Challenge[]>;
  joinChallenge(membership: Membership): Promise<void>;
  listMemberships(): Promise<Membership[]>;

  /** One proof per user and month. Fails with "duplicate" when another user already used the same consumer number for that month. */
  upsertBillProof(proof: BillProof): Promise<{ ok: true } | { ok: false; reason: "duplicate" }>;
  listBillProofs(userId?: string): Promise<BillProof[]>;
  /** The proof for this consumer number fingerprint and month, whoever owns it. */
  findBillProof(consumerHash: string, period: string): Promise<BillProof | null>;

  listVendors(): Promise<Vendor[]>;
  addVendor(vendor: Vendor): Promise<Vendor>;
  /** Returns the updated vendor, or null when the id does not exist. */
  setVendorStatus(id: string, status: VendorStatus): Promise<Vendor | null>;
  /** Replaces the editable details of a listing and sets its status in one step. Returns null when the id does not exist. */
  updateVendor(id: string, patch: Partial<Pick<Vendor, "name" | "city" | "pincode" | "services" | "phone" | "website" | "empanelmentClaim">>, status: VendorStatus): Promise<Vendor | null>;
}
