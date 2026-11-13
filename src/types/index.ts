export type Cadence = "daily" | "weekly" | "once";
export type TaskCategory = "energy" | "mobility" | "cooking" | "community";
export type VerificationTier = "self_reported" | "bill_verified" | "smart_meter";

/** Who is signed in. Each role sees only its own screens: households, installers, and GEDA administrators. */
export type Role = "citizen" | "installer" | "admin";
export type HomeType = "apartment" | "independent" | "row-house";
export type Ownership = "owner" | "tenant";
export type RoofAccess = "none" | "shared" | "own";
export type EvKind = "none" | "two-wheeler" | "car";

/** What the home has, so tips, tasks and tools can be limited to what applies. Unknown (older accounts) means show everything. */
export interface Equipment {
  acCount: number;
  geyser: boolean;
  washingMachine: boolean;
  dryer: boolean;
  waterPump: boolean;
  inductionStove: boolean;
  lpg: boolean;
  petrolCar: boolean;
  petrolTwoWheeler: boolean;
  ev: EvKind;
  rooftopSolar: boolean;
  inverterBattery: boolean;
}

export interface User {
  id: string;
  /** Older accounts have no role stored and are households. */
  role: Role;
  displayName: string;
  pincode: string;
  householdSize: number;
  leaderboardOptIn: boolean;
  isDemo: boolean;
  homeType?: HomeType;
  ownership?: Ownership;
  roofAccess?: RoofAccess;
  equipment?: Equipment;
  /**
   * Only set on the sample households, so the leaderboard can show what each trust tier looks like. Real
   * households get their tier from evidence (a scanned bill), never from this field.
   */
  verificationTier?: VerificationTier;
  /** Set once the household adds an account, so it can sign in from another device. Never the password. */
  email?: string;
  createdAt: string;
}

/** Sign-in details, kept apart from User so a password hash can never travel with a profile. */
export interface Credentials {
  userId: string;
  email: string;
  passwordHash: string;
}

/** Monthly inputs a household reports. Everything is optional except electricity. */
export interface FootprintInput {
  electricityKwh: number;
  billAmountInr?: number;
  lpgCylinders: number;
  carKm: number;
  bikeKm: number;
  publicKm: number;
}

export interface FootprintBreakdown {
  electricityKg: number;
  commuteKg: number;
  lpgKg: number;
  totalKg: number;
  factorVersion: string;
}

export interface Snapshot extends FootprintInput, FootprintBreakdown {
  id: string;
  userId: string;
  /** Billing month, YYYY-MM. One snapshot per user per period. */
  period: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  cadence: Cadence;
  points: number;
  /** Electricity avoided per completion, converted to CO2e with the active emission factor. */
  kwhSaved: number;
  /** Non-electricity CO2e avoided per completion. */
  kgSaved: number;
  /** How the saving was estimated, shown to the user. */
  assumption: string;
  /** Hours of the day (India time) when the task can be claimed. Outside them the server refuses it. */
  window?: { fromHour: number; toHour: number };
  /** Tasks that need a photo reviewed by an administrator before any points are awarded. */
  proof?: "photo";
}

export interface Completion {
  id: string;
  userId: string;
  taskId: string;
  /** Unique per user: stops a task being rewarded twice in its cadence window. */
  dedupeKey: string;
  completedOn: string;
  points: number;
  impactKg: number;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  region: string;
  /** First three PIN digits the goal is local to, or null for state-wide. */
  regionPrefix: string | null;
  metric: "kg_avoided" | "actions";
  target: number;
  startsOn: string;
  endsOn: string;
}

export interface Membership {
  challengeId: string;
  userId: string;
  joinedAt: string;
}

export type VendorService = "rooftop-solar" | "solar-water-heater" | "ev-charging" | "energy-audit" | "efficient-appliances";
export type VendorStatus = "pending" | "approved" | "rejected";

/** A business listed in the resource hub. Only approved listings are public. */
export interface Vendor {
  id: string;
  name: string;
  city: string;
  pincode: string;
  services: VendorService[];
  phone?: string;
  website?: string;
  /** What the vendor says about its empanelment. Self-declared, so the page tells citizens to verify it. */
  empanelmentClaim?: string;
  status: VendorStatus;
  /** Sample listings are placeholders for demos and are labelled as such everywhere. */
  isSample: boolean;
  /** The installer account that manages this listing, if one does. */
  ownerUserId?: string;
  createdAt: string;
}

/**
 * What we keep about a scanned bill: the readings and a one-way fingerprint of the consumer number, so the
 * same bill cannot be used twice. Never the image, the name, the address or the full consumer number.
 */
export interface BillProof {
  id: string;
  userId: string;
  period: string;
  consumerHash: string;
  consumerLast4: string;
  previousReading: number;
  currentReading: number;
  multiplier: number;
  units: number;
  amountInr?: number;
  source: "image" | "pdf";
  createdAt: string;
}

export type TaskProofStatus = "pending" | "approved" | "rejected";

/**
 * A photo sent as evidence for a high-impact action, waiting for an administrator. The photo is kept only until
 * it has been reviewed and is deleted straight after, whatever the decision, so we do not hold pictures of homes.
 */
export interface TaskProof {
  id: string;
  userId: string;
  taskId: string;
  status: TaskProofStatus;
  /** A small JPEG as a data URL. Null once the proof has been reviewed. */
  image: string | null;
  createdAt: string;
  reviewedAt?: string;
}

export interface StoreData {
  users: User[];
  snapshots: Snapshot[];
  completions: Completion[];
  challenges: Challenge[];
  memberships: Membership[];
  vendors: Vendor[];
  credentials: Credentials[];
  billProofs: BillProof[];
  taskProofs: TaskProof[];
}
