export type Cadence = "daily" | "weekly" | "once";
export type TaskCategory = "energy" | "mobility" | "cooking" | "community";

export interface User {
  id: string;
  displayName: string;
  pincode: string;
  householdSize: number;
  leaderboardOptIn: boolean;
  isDemo: boolean;
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
  createdAt: string;
}

export interface StoreData {
  users: User[];
  snapshots: Snapshot[];
  completions: Completion[];
  challenges: Challenge[];
  memberships: Membership[];
  vendors: Vendor[];
  credentials: Credentials[];
}
