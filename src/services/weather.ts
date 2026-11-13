import "server-only";
import { z } from "zod";
import { mjToKwh, type Weather } from "@/lib/calculations/weather";
import { placeForPincode } from "@/lib/weather/places";

/**
 * Live forecast from Open-Meteo (free, no key, CC BY 4.0). Every failure returns null so a slow or offline
 * weather service can never break a page: the UI and the nudges simply carry on without weather.
 */
const forecastSchema = z.object({
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    relative_humidity_2m: z.number(),
    cloud_cover: z.number(),
  }),
  daily: z.object({
    temperature_2m_max: z.array(z.number()).min(1),
    sunshine_duration: z.array(z.number()).min(1),
    shortwave_radiation_sum: z.array(z.number()).min(1),
  }),
});

const TIMEOUT_MS = 4000;
/** Forecasts barely change in 15 minutes, so serving a cached copy keeps pages fast and the free API unhammered. */
const CACHE_SECONDS = 900;

export async function getWeatherForPincode(pincode: string): Promise<Weather | null> {
  const place = placeForPincode(pincode);
  if (!place) return null;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(place.latitude));
  url.searchParams.set("longitude", String(place.longitude));
  url.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,cloud_cover");
  url.searchParams.set("daily", "temperature_2m_max,sunshine_duration,shortwave_radiation_sum");
  url.searchParams.set("timezone", "Asia/Kolkata");
  url.searchParams.set("forecast_days", "1");

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: CACHE_SECONDS } });
    if (!res.ok) return null;
    const data = forecastSchema.parse(await res.json());
    return {
      city: place.city,
      observedAt: data.current.time,
      tempC: data.current.temperature_2m,
      feelsLikeC: data.current.apparent_temperature,
      humidityPct: data.current.relative_humidity_2m,
      cloudPct: data.current.cloud_cover,
      today: {
        maxC: data.daily.temperature_2m_max[0],
        sunshineHours: Math.round((data.daily.sunshine_duration[0] / 3600) * 10) / 10,
        radiationKwhM2: mjToKwh(data.daily.shortwave_radiation_sum[0]),
      },
    };
  } catch {
    return null;
  }
}
