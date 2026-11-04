import type { Completion, Snapshot, User } from "@/types";

/** Smallest group an administrator may see numbers for. Smaller groups are suppressed. */
export const MIN_GROUP_SIZE = 5;

// First three PIN digits to area name. Unknown prefixes fall back to the raw prefix.
const REGION_NAMES: Record<string, string> = {
  "360": "Rajkot", "361": "Jamnagar", "364": "Bhavnagar", "380": "Ahmedabad", "382": "Gandhinagar", "390": "Vadodara", "395": "Surat",
};

export const regionOf = (pincode: string) => pincode.slice(0, 3);
export const regionLabel = (prefix: string) => REGION_NAMES[prefix] ?? `PIN ${prefix}xxx`;

export interface RegionRow {
  prefix: string;
  label: string;
  suppressed: boolean;
  households: number | null;
  avgKwh: number | null;
  totalKg: number | null;
  actions: number | null;
}

export interface AdminSummary {
  rows: RegionRow[];
  totalHouseholds: number;
  demoHouseholds: number;
  suppressedGroups: number;
  k: number;
}

/** Aggregates per three-digit PIN prefix from each household's latest snapshot. Never returns an individual's data. */
export function aggregateByRegion(users: User[], snapshots: Snapshot[], completions: Completion[], k: number = MIN_GROUP_SIZE): AdminSummary {
  const latest = new Map<string, Snapshot>();
  for (const s of snapshots) {
    const cur = latest.get(s.userId);
    if (!cur || s.period > cur.period) latest.set(s.userId, s);
  }
  const actionsBy = new Map<string, number>();
  for (const c of completions) actionsBy.set(c.userId, (actionsBy.get(c.userId) ?? 0) + 1);

  const groups = new Map<string, User[]>();
  for (const u of users) groups.set(regionOf(u.pincode), [...(groups.get(regionOf(u.pincode)) ?? []), u]);

  const rows: RegionRow[] = [...groups.entries()].map(([prefix, members]) => {
    const base = { prefix, label: regionLabel(prefix) };
    if (members.length < k) return { ...base, suppressed: true, households: null, avgKwh: null, totalKg: null, actions: null };
    const snaps = members.map((m) => latest.get(m.id)).filter((s): s is Snapshot => Boolean(s));
    const kwh = snaps.reduce((a, s) => a + s.electricityKwh, 0);
    return {
      ...base,
      suppressed: false,
      households: members.length,
      avgKwh: snaps.length ? Math.round(kwh / snaps.length) : 0,
      totalKg: Math.round(snaps.reduce((a, s) => a + s.totalKg, 0)),
      actions: members.reduce((a, m) => a + (actionsBy.get(m.id) ?? 0), 0),
    };
  });

  rows.sort((a, b) => Number(a.suppressed) - Number(b.suppressed) || (b.households ?? 0) - (a.households ?? 0));
  return { rows, totalHouseholds: users.length, demoHouseholds: users.filter((u) => u.isDemo).length, suppressedGroups: rows.filter((r) => r.suppressed).length, k };
}
