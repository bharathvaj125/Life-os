import type { User } from "@/types";

export type DemoKey = "patel" | "desai" | "installer" | "admin";

export interface DemoAccountInfo {
  key: DemoKey;
  /** Short label on the welcome screen. */
  title: string;
  blurb: string;
  role: User["role"];
  initial: string;
}

/** What the welcome screen shows. The builders below create the matching account on first use. */
export const DEMO_ACCOUNTS: DemoAccountInfo[] = [
  { key: "patel", title: "Anika Trivedi", blurb: "Household · Ahmedabad flat with two ACs and a geyser", role: "citizen", initial: "A" },
  { key: "desai", title: "Rohan Parmar", blurb: "Household · Surat house with rooftop solar and an e-scooter", role: "citizen", initial: "R" },
  { key: "installer", title: "Sunrise Solar", blurb: "Installer · manage a vendor listing and see local demand", role: "installer", initial: "S" },
  { key: "admin", title: "GEDA administrator", blurb: "Administrator · area totals and vendor review (view only)", role: "admin", initial: "G" },
];

export const demoUserId = (key: DemoKey) => `demo-login-${key}`;
export const isDemoKey = (v: unknown): v is DemoKey => DEMO_ACCOUNTS.some((a) => a.key === v);
