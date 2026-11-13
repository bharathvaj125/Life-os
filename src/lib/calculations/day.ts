/**
 * The shape of a household's day, used by the Sun Arc on the dashboard. The windows match the rules the app
 * already enforces: midday solar hours (10 AM to 3 PM) and the evening peak (6 to 10 PM).
 */
export const SOLAR_FROM = 10;
export const SOLAR_TO = 15;
export const PEAK_FROM = 18;
export const PEAK_TO = 22;
/** The arc spans 5 AM to 11 PM, which is the part of the day people plan around. */
export const ARC_FROM = 5;
export const ARC_TO = 23;

export interface DayAdvice {
  phase: "off-peak" | "before-solar" | "solar" | "afternoon" | "peak";
  title: string;
  text: string;
}

/** Fractional India-time hour (for example 17.5 is 5:30 PM), from any date. */
export function istClock(d: Date): number {
  const ist = new Date(d.getTime() + 5.5 * 3_600_000);
  return ist.getUTCHours() + ist.getUTCMinutes() / 60;
}

/** What to do with the electricity at this time of day. Plain rules, no forecast needed. */
export function dayAdvice(hour: number): DayAdvice {
  if (hour >= PEAK_FROM && hour < PEAK_TO) return { phase: "peak", title: "Evening peak is on", text: "Hold the geyser, washing machine and iron until after 10 PM." };
  if (hour >= SOLAR_FROM && hour < SOLAR_TO) return { phase: "solar", title: "Solar hours are on", text: "A good time for the water pump and the washing machine." };
  if (hour >= SOLAR_TO && hour < PEAK_FROM) return { phase: "afternoon", title: "Finish heavy loads before 6 PM", text: "The evening peak starts at 6 PM, so run what you can now." };
  if (hour >= ARC_FROM && hour < SOLAR_FROM) return { phase: "before-solar", title: "Solar hours open at 10 AM", text: "Plan the pump and washing machine for the midday window." };
  return { phase: "off-peak", title: "The grid is calm now", text: "Off-peak hours. A good time to charge an EV or run a timer." };
}

/** Where an hour sits on the arc, as an angle in radians from the left end (0) to the right end (PI). */
export function arcAngle(hour: number): number {
  const t = Math.min(1, Math.max(0, (hour - ARC_FROM) / (ARC_TO - ARC_FROM)));
  return Math.PI * t;
}
