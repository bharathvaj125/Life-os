import "server-only";
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
