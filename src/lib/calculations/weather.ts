export interface Weather {
  city: string;
  /** Local time of the observation, as reported by the forecast service. */
  observedAt: string;
  tempC: number;
  feelsLikeC: number;
  humidityPct: number;
  cloudPct: number;
  today: {
    maxC: number;
    sunshineHours: number;
    /** Daily total solar radiation on a flat surface, in kWh per square metre (about the same as "peak sun hours"). */
    radiationKwhM2: number;
  };
}

/** Share of the ideal output a real rooftop system delivers after heat, dust, wiring and inverter losses. */
export const PERFORMANCE_RATIO = 0.75;

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Expected generation today for a system of the given size, from the day's forecast radiation. A planning estimate. */
export function solarYieldTodayKwh(capacityKwp: number, radiationKwhM2: number): number {
  return round1(Math.max(0, capacityKwp) * Math.max(0, radiationKwhM2) * PERFORMANCE_RATIO);
}

/** Open-Meteo reports daily radiation in MJ per square metre. 3.6 MJ equals 1 kWh. */
export const mjToKwh = (mj: number) => round1(mj / 3.6);

export type WeatherTone = "hot" | "sunny" | "mild" | "cloudy";

export function describeToday(w: Weather): { tone: WeatherTone; label: string } {
  if (w.today.maxC >= 35) return { tone: "hot", label: "Hot day" };
  if (w.today.sunshineHours >= 8) return { tone: "sunny", label: "Sunny day" };
  if (w.today.maxC <= 28) return { tone: "mild", label: "Mild day" };
  return { tone: "cloudy", label: "Mixed sun" };
}
