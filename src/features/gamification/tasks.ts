import type { Equipment, RoofAccess, Task } from "@/types";

/** Task catalogue. Savings are per completion and self-reported, so each one lists its assumption. */
export const TASKS: Task[] = [
  { id: "ac-setpoint", title: "Run the AC at 24–26 °C today", description: "Set the thermostat no lower than 24 °C.", category: "energy", cadence: "daily", points: 10, kwhSaved: 1, kgSaved: 0, assumption: "About 8 hours of AC, roughly 6% saved per degree, 2 degrees warmer, 1.2 kW average draw." },
  { id: "peak-shift", title: "Run heavy appliances outside 6–10 PM", description: "Move the washing machine, geyser or iron to off-peak hours.", category: "energy", cadence: "daily", points: 15, kwhSaved: 0, kgSaved: 0, assumption: "Eases peak demand but does not cut units, so no kWh saving is claimed." },
  { id: "standby-off", title: "Switch standby devices off at the socket", description: "TV, set-top box, chargers and the printer.", category: "energy", cadence: "daily", points: 10, kwhSaved: 0.3, kgSaved: 0, assumption: "About 15 W of standby load for 20 hours." },
  { id: "geyser-short", title: "Cut the geyser time by 10 minutes", description: "Switch off before the water is fully hot and use the stored heat.", category: "energy", cadence: "daily", points: 10, kwhSaved: 0.5, kgSaved: 0, assumption: "A 3 kW geyser running 10 minutes less." },
  { id: "air-dry", title: "Air-dry the laundry this week", description: "Skip the dryer for a week.", category: "energy", cadence: "weekly", points: 20, kwhSaved: 4, kgSaved: 0, assumption: "Two dryer loads at about 2 kWh each." },
  { id: "led-swap", title: "Replace old bulbs with LEDs", description: "Swap incandescent or CFL bulbs in the rooms you use most.", category: "energy", cadence: "once", points: 40, kwhSaved: 30, kgSaved: 0, assumption: "Four bulbs, 50 W saved each, 5 hours a day, counted once for one month.", proof: "photo" },
  { id: "bee-appliance", title: "Buy a BEE 5-star appliance", description: "Replace an old fridge, AC or fan with a 5-star rated one. Send a photo of its energy label.", category: "energy", cadence: "once", points: 40, kwhSaved: 0, kgSaved: 0, assumption: "A reviewed photo earns the points. No saving is claimed until it shows on your bill.", proof: "photo" },
  { id: "solar-installed", title: "Get rooftop solar installed", description: "Send a photo of your installed panels or the inverter. An administrator checks it.", category: "community", cadence: "once", points: 40, kwhSaved: 0, kgSaved: 0, assumption: "A reviewed photo earns the points. Real generation shows up on your meter and bill.", proof: "photo" },
  { id: "transit-day", title: "Leave the car at home for a day", description: "Use the bus, metro, a shared ride or walk.", category: "mobility", cadence: "weekly", points: 25, kwhSaved: 0, kgSaved: 1.4, assumption: "A 10 km trip by public transport instead of by car." },
  { id: "pressure-cook", title: "Use a pressure cooker for a meal", description: "Dal, rice or vegetables in a pressure cooker.", category: "cooking", cadence: "daily", points: 10, kwhSaved: 0, kgSaved: 0.15, assumption: "About 0.05 kg less LPG per meal." },
  { id: "join-challenge", title: "Join a community challenge", description: "Pick a goal on the Community page.", category: "community", cadence: "once", points: 20, kwhSaved: 0, kgSaved: 0, assumption: "Participation only, no saving claimed." },
  { id: "solar-estimate", title: "Check what rooftop solar could do for you", description: "Run the estimate on the Resources page.", category: "community", cadence: "once", points: 20, kwhSaved: 0, kgSaved: 0, assumption: "Learning step, no saving claimed." },
  { id: "ev-night-charge", title: "Charge your EV outside 6–10 PM", description: "Plug in after 10 PM or before 6 PM this week.", category: "mobility", cadence: "weekly", points: 20, kwhSaved: 0, kgSaved: 0, assumption: "Moves load off the evening peak but does not cut units, so no saving is claimed." },
  { id: "pump-midday", title: "Run the water pump at midday", description: "Fill the tank between 10 AM and 3 PM instead of the evening.", category: "energy", cadence: "daily", points: 10, kwhSaved: 0, kgSaved: 0, assumption: "Eases the evening peak and suits solar hours. No unit saving is claimed.", window: { fromHour: 10, toHour: 15 } },
  { id: "solar-selfuse", title: "Use your own solar power", description: "Run the washing machine or other heavy loads between 10 AM and 3 PM.", category: "energy", cadence: "daily", points: 15, kwhSaved: 0, kgSaved: 0, assumption: "Uses your own generation directly. No saving is claimed beyond what your meter shows.", window: { fromHour: 10, toHour: 15 } },
];

export const getTask = (id: string) => TASKS.find((t) => t.id === id);

/** What a task needs a home to have. A task not listed here applies to every home. */
const NEEDS: Record<string, (e: Equipment, roof: RoofAccess | undefined) => boolean> = {
  "ac-setpoint": (e) => e.acCount > 0,
  "peak-shift": (e) => e.washingMachine || e.geyser || e.dryer || e.waterPump || e.ev !== "none",
  "geyser-short": (e) => e.geyser,
  "air-dry": (e) => e.dryer,
  "transit-day": (e) => e.petrolCar || e.petrolTwoWheeler,
  "pressure-cook": (e) => e.lpg || e.inductionStove,
  "solar-estimate": (e, roof) => !e.rooftopSolar && roof !== "none",
  "ev-night-charge": (e) => e.ev !== "none",
  "pump-midday": (e) => e.waterPump,
  "solar-selfuse": (e) => e.rooftopSolar,
  "solar-installed": (e) => e.rooftopSolar,
};

/**
 * Whether a task applies to a home. When the equipment is unknown (accounts made before the wizard existed)
 * every task applies, except the three that only make sense for a specific appliance.
 */
export function taskApplies(task: Task, equipment: Equipment | undefined, roof?: RoofAccess): boolean {
  const needs = NEEDS[task.id];
  if (!needs) return true;
  if (!equipment) return !["ev-night-charge", "pump-midday", "solar-selfuse", "solar-installed"].includes(task.id);
  return needs(equipment, roof);
}

export const tasksFor = (equipment: Equipment | undefined, roof?: RoofAccess): Task[] => TASKS.filter((t) => taskApplies(t, equipment, roof));

/** The AC setpoint task only makes sense on a day warm enough to run an AC. */
export const AC_TASK_MIN_MAX_C = 28;

export interface TaskContext {
  /** Hour of the day in India time, 0 to 23. */
  hour: number;
  /** Today's forecast high in the household's city. Unknown (null) never blocks anything. */
  maxC?: number | null;
}

export const formatHour = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 || h === 24 ? "AM" : "PM"}`;

/**
 * Why a task cannot be claimed right now, or null when it can. These rules are the server's, so a task button
 * that is switched off in the browser cannot be bypassed by calling the API directly. When the weather is
 * unknown the weather rule steps aside rather than blocking people for a reason we cannot check.
 */
export function taskBlockReason(task: Task, { hour, maxC }: TaskContext): string | null {
  if (task.window && !(hour >= task.window.fromHour && hour < task.window.toHour)) {
    return `You can only claim this between ${formatHour(task.window.fromHour)} and ${formatHour(task.window.toHour)} (India time).`;
  }
  if (task.id === "ac-setpoint" && maxC != null && maxC < AC_TASK_MIN_MAX_C) {
    return `Today's high is only ${Math.round(maxC)} °C, so an AC setpoint task is not needed today.`;
  }
  return null;
}
