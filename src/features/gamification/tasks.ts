import type { Task } from "@/types";

/** Task catalogue. Savings are per completion and self-reported, so each one lists its assumption. */
export const TASKS: Task[] = [
  { id: "ac-setpoint", title: "Run the AC at 24–26 °C today", description: "Set the thermostat no lower than 24 °C.", category: "energy", cadence: "daily", points: 10, kwhSaved: 1, kgSaved: 0, assumption: "About 8 hours of AC, roughly 6% saved per degree, 2 degrees warmer, 1.2 kW average draw." },
  { id: "peak-shift", title: "Run heavy appliances outside 6–10 PM", description: "Move the washing machine, geyser or iron to off-peak hours.", category: "energy", cadence: "daily", points: 15, kwhSaved: 0, kgSaved: 0, assumption: "Eases peak demand but does not cut units, so no kWh saving is claimed." },
  { id: "standby-off", title: "Switch standby devices off at the socket", description: "TV, set-top box, chargers and the printer.", category: "energy", cadence: "daily", points: 10, kwhSaved: 0.3, kgSaved: 0, assumption: "About 15 W of standby load for 20 hours." },
  { id: "geyser-short", title: "Cut the geyser time by 10 minutes", description: "Switch off before the water is fully hot and use the stored heat.", category: "energy", cadence: "daily", points: 10, kwhSaved: 0.5, kgSaved: 0, assumption: "A 3 kW geyser running 10 minutes less." },
  { id: "air-dry", title: "Air-dry the laundry this week", description: "Skip the dryer for a week.", category: "energy", cadence: "weekly", points: 20, kwhSaved: 4, kgSaved: 0, assumption: "Two dryer loads at about 2 kWh each." },
  { id: "led-swap", title: "Replace old bulbs with LEDs", description: "Swap incandescent or CFL bulbs in the rooms you use most.", category: "energy", cadence: "once", points: 40, kwhSaved: 30, kgSaved: 0, assumption: "Four bulbs, 50 W saved each, 5 hours a day, counted once for one month." },
  { id: "transit-day", title: "Leave the car at home for a day", description: "Use the bus, metro, a shared ride or walk.", category: "mobility", cadence: "weekly", points: 25, kwhSaved: 0, kgSaved: 1.4, assumption: "A 10 km trip by public transport instead of by car." },
  { id: "pressure-cook", title: "Use a pressure cooker for a meal", description: "Dal, rice or vegetables in a pressure cooker.", category: "cooking", cadence: "daily", points: 10, kwhSaved: 0, kgSaved: 0.15, assumption: "About 0.05 kg less LPG per meal." },
  { id: "join-challenge", title: "Join a community challenge", description: "Pick a goal on the Community page.", category: "community", cadence: "once", points: 20, kwhSaved: 0, kgSaved: 0, assumption: "Participation only, no saving claimed." },
  { id: "solar-estimate", title: "Check what rooftop solar could do for you", description: "Run the estimate on the Resources page.", category: "community", cadence: "once", points: 20, kwhSaved: 0, kgSaved: 0, assumption: "Learning step, no saving claimed." },
];

export const getTask = (id: string) => TASKS.find((t) => t.id === id);
