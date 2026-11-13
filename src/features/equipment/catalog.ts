import type { Equipment, EvKind, HomeType, Ownership, RoofAccess } from "@/types";

/** What a brand-new household starts with in the wizard. Nothing ticked, so people choose what they really have. */
export const EMPTY_EQUIPMENT: Equipment = {
  acCount: 0,
  geyser: false,
  washingMachine: false,
  dryer: false,
  waterPump: false,
  inductionStove: false,
  lpg: false,
  petrolCar: false,
  petrolTwoWheeler: false,
  ev: "none",
  rooftopSolar: false,
  inverterBattery: false,
};

type ToggleKey = "geyser" | "washingMachine" | "dryer" | "waterPump" | "inductionStove" | "lpg" | "petrolCar" | "petrolTwoWheeler" | "rooftopSolar" | "inverterBattery";

/** Yes/no items. `icon` is a lucide icon name resolved in the client components. */
export const EQUIPMENT_TOGGLES: { key: ToggleKey; label: string; hint: string; icon: string }[] = [
  { key: "geyser", label: "Electric water heater", hint: "Geyser or storage heater", icon: "Droplets" },
  { key: "washingMachine", label: "Washing machine", hint: "Top or front loading", icon: "WashingMachine" },
  { key: "dryer", label: "Clothes dryer", hint: "Electric tumble dryer", icon: "Wind" },
  { key: "waterPump", label: "Water pump", hint: "Motor for a tank or borewell", icon: "Waves" },
  { key: "inductionStove", label: "Induction cooktop", hint: "Electric cooking", icon: "CookingPot" },
  { key: "lpg", label: "LPG cooking gas", hint: "Cylinders or piped gas", icon: "Flame" },
  { key: "petrolCar", label: "Petrol or diesel car", hint: "Any fuel car", icon: "Car" },
  { key: "petrolTwoWheeler", label: "Petrol scooter or bike", hint: "Two-wheeler", icon: "Bike" },
  { key: "rooftopSolar", label: "Rooftop solar", hint: "Panels already installed", icon: "SunMedium" },
  { key: "inverterBattery", label: "Inverter or battery backup", hint: "Home UPS", icon: "BatteryCharging" },
];

export const EV_OPTIONS: { value: EvKind; label: string }[] = [
  { value: "none", label: "No electric vehicle" },
  { value: "two-wheeler", label: "Electric scooter or bike" },
  { value: "car", label: "Electric car" },
];

export const HOME_TYPES: { value: HomeType; label: string; hint: string }[] = [
  { value: "apartment", label: "Apartment", hint: "Flat in a building or society" },
  { value: "independent", label: "Independent house", hint: "Bungalow or standalone home" },
  { value: "row-house", label: "Row house", hint: "Tenement or row house" },
];

export const OWNERSHIP_OPTIONS: { value: Ownership; label: string }[] = [
  { value: "owner", label: "I own this home" },
  { value: "tenant", label: "I rent this home" },
];

export const ROOF_OPTIONS: { value: RoofAccess; label: string; hint: string }[] = [
  { value: "own", label: "My own roof or terrace", hint: "I can put panels up" },
  { value: "shared", label: "Shared roof", hint: "Society or building decides" },
  { value: "none", label: "No roof access", hint: "Ground or middle floor" },
];

/** Short phrases for the review step and the profile page. */
export function describeEquipment(e: Equipment): string[] {
  const out: string[] = [];
  if (e.acCount > 0) out.push(`${e.acCount} AC${e.acCount > 1 ? "s" : ""}`);
  for (const t of EQUIPMENT_TOGGLES) if (e[t.key]) out.push(t.label);
  if (e.ev !== "none") out.push(EV_OPTIONS.find((o) => o.value === e.ev)?.label ?? "Electric vehicle");
  return out;
}
