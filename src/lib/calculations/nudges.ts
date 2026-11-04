import type { Snapshot, TaskCategory } from "@/types";
import { istDate, istHour } from "@/lib/dates";
import { EMISSION_FACTORS } from "./emission-factors";

export interface Nudge {
  id: string;
  title: string;
  why: string;
  action: string;
  category: TaskCategory | "solar";
  priority: number;
  savingKwhPerMonth?: number;
  savingKgPerMonth?: number;
  /** Only set when the user entered a bill amount: uses their own rupees-per-unit, not an assumed tariff. */
  savingInrPerMonth?: number;
  href?: string;
}

export interface NudgeContext {
  householdSize: number;
  /** Sorted by period ascending. */
  snapshots: Snapshot[];
  now: Date;
}

const AC_MONTHS = [3, 4, 5, 6];

/** Rule-based, explainable nudges. Every suggestion states why it fired and how its saving was estimated. */
export function generateNudges({ householdSize, snapshots, now }: NudgeContext): Nudge[] {
  const out: Nudge[] = [];
  const hour = istHour(now);
  const month = Number(istDate(now).slice(5, 7));
  const latest = snapshots.at(-1);
  const previous = snapshots.at(-2);

  if (hour >= 18 && hour < 22) {
    out.push({
      id: "peak-now",
      category: "energy",
      priority: 100,
      title: "Evening peak is on right now",
      why: "Household demand across the grid typically peaks between about 6 and 10 PM. Check your DISCOM for its exact time-of-day rules.",
      action: "Hold the geyser, washing machine, iron and EV charger until after 10 PM, or run them before 6 PM.",
    });
  }

  if (!latest) {
    out.push({ id: "add-baseline", category: "energy", priority: 90, title: "Add your first month", why: "Nudges are built from your own electricity use.", action: "Enter last month's units on the Footprint page.", href: "/footprint" });
    return out;
  }

  const rate = latest.billAmountInr && latest.electricityKwh > 0 ? latest.billAmountInr / latest.electricityKwh : undefined;
  const inr = (kwh: number) => (rate ? Math.round(kwh * rate) : undefined);
  const perPerson = latest.electricityKwh / Math.max(1, householdSize);

  if (previous && previous.electricityKwh > 0) {
    const rise = (latest.electricityKwh - previous.electricityKwh) / previous.electricityKwh;
    if (rise >= 0.1) {
      const kwh = Math.round(latest.electricityKwh - previous.electricityKwh);
      out.push({ id: "usage-up", category: "energy", priority: 80, title: `Usage rose ${Math.round(rise * 100)}% from last month`, why: `${latest.electricityKwh} kWh against ${previous.electricityKwh} kWh.`, action: "Look for a new always-on load or longer AC and geyser hours, and bring it back to last month's level.", savingKwhPerMonth: kwh, savingInrPerMonth: inr(kwh) });
    }
  }

  if (perPerson > 90) {
    const kwh = Math.round(latest.electricityKwh * 0.1);
    out.push({ id: "high-usage", category: "energy", priority: 70, title: "Above the usual use per person", why: `About ${Math.round(perPerson)} kWh per person this month. Many households stay under 90 (a rule of thumb, not a standard).`, action: "Start with the biggest loads: AC, geyser, fridge and water pump timers.", savingKwhPerMonth: kwh, savingInrPerMonth: inr(kwh) });
  }

  if (AC_MONTHS.includes(month) && latest.electricityKwh >= 150) {
    const kwh = Math.round(latest.electricityKwh * 0.08);
    out.push({ id: "ac-setpoint", category: "energy", priority: 65, title: "Set the AC to 24–26 °C", why: "It is the hot season and each degree warmer saves roughly 6% of AC energy. We assume AC is about a third of your bill.", action: "Set 24–26 °C with the fan on auto.", savingKwhPerMonth: kwh, savingInrPerMonth: inr(kwh) });
  }

  if (latest.carKm >= 200) {
    const kg = Math.round(latest.carKm * 0.3 * (EMISSION_FACTORS.carKgPerKm - EMISSION_FACTORS.publicKgPerKm));
    out.push({ id: "shift-car-km", category: "mobility", priority: 60, title: "Swap some car trips", why: `You logged ${latest.carKm} km by car this month.`, action: "Replace about a third of those km with the bus, metro or a shared ride.", savingKgPerMonth: kg });
  }

  if (latest.lpgCylinders >= 1) {
    const kg = Math.round(latest.lpgCylinders * EMISSION_FACTORS.lpgKgPerCylinder * 0.1);
    out.push({ id: "pressure-cooker", category: "cooking", priority: 50, title: "Cook smarter with LPG", why: "Pressure cooking and lids on pans can cut cooking gas use by around 10%.", action: "Use a pressure cooker for dal and rice, and soak pulses ahead.", savingKgPerMonth: kg });
  }

  if (latest.electricityKwh >= 250) {
    out.push({ id: "solar-look", category: "solar", priority: 40, title: "Your use is high enough to explore rooftop solar", why: `${latest.electricityKwh} kWh a month is a good fit for a rooftop system.`, action: "Run the solar estimate with your roof area.", href: "/resources" });
  }

  const standby = Math.round(latest.electricityKwh * 0.05);
  out.push({ id: "standby", category: "energy", priority: 30, title: "Hunt for standby loads", why: "Idle TVs, set-top boxes and chargers can add up to about 5% of a home's use. This is a rule of thumb, so your figure may differ.", action: "Put entertainment gear on a switchable strip and turn it off at night.", savingKwhPerMonth: standby, savingInrPerMonth: inr(standby) });

  if (!previous) {
    out.push({ id: "add-next-month", category: "energy", priority: 20, title: "Add next month to see your trend", why: "A trend needs at least two months.", action: "Log your next bill when it arrives.", href: "/footprint" });
  }

  return out.sort((a, b) => b.priority - a.priority);
}
