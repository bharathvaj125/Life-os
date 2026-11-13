import type { Challenge, Completion, Membership, Snapshot, StoreData, User, Vendor } from "@/types";
import { TASKS } from "@/features/gamification/tasks";
import { calculateFootprint } from "@/lib/calculations/footprint";
import { dedupeKeyFor, impactKgOf } from "@/lib/calculations/gamification";
import { addDays, istDate, istPeriod, shiftPeriod } from "@/lib/dates";

/** Small deterministic generator so the demo data is identical on every machine. */
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const NAMES = ["Aarav", "Diya", "Kabir", "Meera", "Rohan", "Isha", "Vihaan", "Anaya", "Arjun", "Saanvi", "Reyansh", "Kiara", "Yash", "Tara", "Dev", "Nisha", "Om", "Riya"];
const REGIONS: { prefix: string; pincode: string }[] = [
  { prefix: "380", pincode: "380015" },
  { prefix: "382", pincode: "382010" },
  { prefix: "390", pincode: "390007" },
];

/**
 * Demo households make the community and admin views meaningful on a fresh install.
 * They are all flagged isDemo, labelled "(demo)" in the UI, and are not real measurements.
 */
export function buildSeed(now: Date): StoreData {
  const rand = rng(2026);
  const today = istDate(now);
  const period = istPeriod(now);
  const createdAt = now.toISOString();

  const challenges: Challenge[] = [
    { id: "cool-24-ahmedabad", title: "Cool 24 · Ahmedabad", description: "Keep AC at 24 °C or above and shift heavy appliances off-peak.", region: "Ahmedabad", regionPrefix: "380", metric: "actions", target: 250, startsOn: addDays(today, -14), endsOn: addDays(today, 30) },
    { id: "gandhinagar-150kg", title: "150 kg Club · Gandhinagar", description: "Together avoid 150 kg of CO₂e through everyday habits.", region: "Gandhinagar", regionPrefix: "382", metric: "kg_avoided", target: 150, startsOn: addDays(today, -14), endsOn: addDays(today, 30) },
    { id: "gujarat-peak-pledge", title: "Gujarat Peak-Hour Pledge", description: "Gujarat-wide: 1,000 appliance runs moved out of the 6–10 PM peak.", region: "Gujarat", regionPrefix: null, metric: "actions", target: 1000, startsOn: addDays(today, -14), endsOn: addDays(today, 30) },
  ];

  const users: User[] = [];
  const snapshots: Snapshot[] = [];
  const completions: Completion[] = [];
  const memberships: Membership[] = [];

  REGIONS.forEach(({ prefix, pincode }, ri) => {
    for (let i = 0; i < 6; i++) {
      const id = `demo-${prefix}-${i + 1}`;
      const size = 2 + Math.floor(rand() * 4);
      // Sample households show what the trust tiers look like. No sample is marked smart-meter: that tier is not built yet.
      const tier: User["verificationTier"] = i < 3 ? "bill_verified" : "self_reported";
      users.push({ id, role: "citizen", displayName: `${NAMES[ri * 6 + i]} (demo)`, pincode, householdSize: size, leaderboardOptIn: true, isDemo: true, verificationTier: tier, createdAt });

      const base = 90 + size * 45 + rand() * 80;
      for (let m = 2; m >= 0; m--) {
        const kwh = Math.round(base * (1 + (rand() - 0.5) * 0.18 - (2 - m) * -0.01));
        const input = { electricityKwh: kwh, billAmountInr: Math.round(kwh * (5.5 + rand())), lpgCylinders: rand() > 0.5 ? 1 : 0.5, carKm: Math.round(rand() * 300), bikeKm: Math.round(rand() * 250), publicKm: Math.round(rand() * 150) };
        snapshots.push({ ...input, ...calculateFootprint(input), id: `${id}-${m}`, userId: id, period: shiftPeriod(period, -m), createdAt });
      }

      const seen = new Set<string>();
      const count = 6 + Math.floor(rand() * 8);
      for (let n = 0; n < count; n++) {
        const task = TASKS[Math.floor(rand() * 8)];
        const date = addDays(today, -Math.floor(rand() * 13));
        const key = dedupeKeyFor(task, date);
        if (seen.has(key)) continue;
        seen.add(key);
        completions.push({ id: `${id}-c${n}`, userId: id, taskId: task.id, dedupeKey: key, completedOn: date, points: task.points, impactKg: impactKgOf(task), createdAt });
      }

      memberships.push({ challengeId: "gujarat-peak-pledge", userId: id, joinedAt: createdAt });
      memberships.push({ challengeId: ri === 0 ? "cool-24-ahmedabad" : ri === 1 ? "gandhinagar-150kg" : "gujarat-peak-pledge", userId: id, joinedAt: createdAt });
    }
  });

  return { users, snapshots, completions, challenges, memberships: memberships.filter((m, i, all) => all.findIndex((x) => x.challengeId === m.challengeId && x.userId === m.userId) === i), vendors: buildSampleVendors(createdAt), credentials: [], billProofs: [], taskProofs: [] };
}

/**
 * Placeholder listings so the directory can be shown on a fresh install. The names are invented and
 * carry "(sample)"; they have no contact details and are labelled as samples in the UI.
 */
export function buildSampleVendors(createdAt: string): Vendor[] {
  const base = { status: "approved" as const, isSample: true, createdAt };
  return [
    { ...base, id: "sample-vendor-1", name: "Sample Rooftop Solar Works (sample)", city: "Ahmedabad", pincode: "380015", services: ["rooftop-solar", "energy-audit"] },
    { ...base, id: "sample-vendor-2", name: "Sample Surya Installers (sample)", city: "Gandhinagar", pincode: "382010", services: ["rooftop-solar", "solar-water-heater"] },
    { ...base, id: "sample-vendor-3", name: "Sample Green Home Appliances (sample)", city: "Vadodara", pincode: "390007", services: ["efficient-appliances", "energy-audit"] },
    { ...base, id: "sample-vendor-4", name: "Sample EV Charge Point Services (sample)", city: "Surat", pincode: "395003", services: ["ev-charging"] },
    { ...base, id: "sample-vendor-5", name: "Sample Solar Heater Co. (sample)", city: "Rajkot", pincode: "360001", services: ["solar-water-heater", "rooftop-solar"] },
  ];
}
