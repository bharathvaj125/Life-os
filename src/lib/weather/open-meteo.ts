import { z } from "zod";
import { mjToKwh, type Weather } from "@/lib/calculations/weather";
import type { Place } from "./places";

/**
 * Open-Meteo request and response handling, shared by the server and the browser. The server tries first and
 * caches; when it is refused (shared hosting addresses can hit the free service's rate limit) the browser asks
 * on its own connection instead.
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

export function forecastUrl(place: Place): string {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(place.latitude));
  url.searchParams.set("longitude", String(place.longitude));
  url.searchParams.set("current", "temperature_2m,apparent_temperature,relative_humidity_2m,cloud_cover");
  url.searchParams.set("daily", "temperature_2m_max,sunshine_duration,shortwave_radiation_sum");
  url.searchParams.set("timezone", "Asia/Kolkata");
  url.searchParams.set("forecast_days", "1");
  return url.toString();
}

/** Throws if the response is not the shape we expect, so callers can fall back to "no weather". */
export function parseForecast(json: unknown, city: string): Weather {
  const data = forecastSchema.parse(json);
  return {
    city,
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
}
