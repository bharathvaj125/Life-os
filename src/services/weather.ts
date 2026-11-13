import "server-only";
import { z } from "zod";
import type { Weather } from "@/lib/calculations/weather";
import { forecastUrl, parseForecast } from "@/lib/weather/open-meteo";
import { placeForPincode } from "@/lib/weather/places";

/**
 * Live forecast from Open-Meteo (free, no key, CC BY 4.0). Every failure returns null so a slow, offline or
 * rate-limited weather service can never break a page. The browser then tries on its own connection.
 */
const TIMEOUT_MS = 4000;
/** Forecasts barely change in 15 minutes, so serving a cached copy keeps pages fast and the free API unhammered. */
const CACHE_SECONDS = 900;

export async function getWeatherForPincode(pincode: string): Promise<Weather | null> {
  const place = placeForPincode(pincode);
  if (!place) return null;
  try {
    const res = await fetch(forecastUrl(place), { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "user-agent": "LiFE-OS/1.0 (household sustainability app)" }, next: { revalidate: CACHE_SECONDS } });
    if (!res.ok) {
      console.warn(`weather: forecast service answered ${res.status} for ${place.city}`);
      return null;
    }
    return parseForecast(await res.json(), place.city);
  } catch (e) {
    console.warn(`weather: could not load the forecast for ${place.city}: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

/**
 * Today's forecast high, for rules on the server such as the AC task. Open-Meteo first, then MET Norway, which
 * is free, needs no key, and is reachable from shared hosting addresses that Open-Meteo refuses. If neither
 * answers this returns null and the rule steps aside, so a weather outage never blocks anyone.
 */
export async function getTodayMaxTemp(pincode: string): Promise<number | null> {
  const open = await getWeatherForPincode(pincode);
  if (open) return open.today.maxC;
  const place = placeForPincode(pincode);
  if (!place) return null;
  try {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${place.latitude.toFixed(4)}&lon=${place.longitude.toFixed(4)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "user-agent": "LiFE-OS/1.0 https://github.com/bharathvaj125/Life-os" }, next: { revalidate: CACHE_SECONDS } });
    if (!res.ok) {
      console.warn(`weather: MET Norway answered ${res.status} for ${place.city}`);
      return null;
    }
    const data = metSchema.parse(await res.json());
    // The next 24 hourly readings cover today's remaining hours and the start of tomorrow, which is close enough for a daily high.
    const temps = data.properties.timeseries.slice(0, 24).map((t) => t.data.instant.details.air_temperature).filter((n): n is number => typeof n === "number");
    return temps.length ? Math.max(...temps) : null;
  } catch (e) {
    console.warn(`weather: MET Norway lookup failed for ${place.city}: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

const metSchema = z.object({
  properties: z.object({
    timeseries: z.array(z.object({ data: z.object({ instant: z.object({ details: z.object({ air_temperature: z.number().optional() }) }) }) })).min(1),
  }),
});
