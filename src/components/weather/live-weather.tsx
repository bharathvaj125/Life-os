"use client";

import { useEffect, useState } from "react";
import { NudgeList } from "@/components/actions/nudge-list";
import { WeatherCard } from "@/components/weather/weather-card";
import { generateNudges, type Nudge } from "@/lib/calculations/nudges";
import type { Weather } from "@/lib/calculations/weather";
import { forecastUrl, parseForecast } from "@/lib/weather/open-meteo";
import { placeForPincode } from "@/lib/weather/places";
import type { Snapshot } from "@/types";

const WEATHER_NUDGE_IDS = new Set(["ac-setpoint", "mild-day", "sun-dry"]);

/**
 * The server's forecast when it has one. When it does not (the free forecast service sometimes refuses shared
 * hosting addresses), the browser asks the service itself, which uses the visitor's own connection.
 */
export function useWeather(pincode: string, serverWeather: Weather | null): { weather: Weather | null; loading: boolean } {
  const place = placeForPincode(pincode);
  const needsBrowserLookup = !serverWeather && Boolean(place);
  const [fetched, setFetched] = useState<{ weather: Weather | null; done: boolean }>({ weather: null, done: false });

  useEffect(() => {
    if (!needsBrowserLookup || !place) return;
    const controller = new AbortController();
    fetch(forecastUrl(place), { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((json) => setFetched({ weather: parseForecast(json, place.city), done: true }))
      .catch(() => setFetched((prev) => (controller.signal.aborted ? prev : { weather: null, done: true })));
    return () => controller.abort();
  }, [needsBrowserLookup, place]);

  return { weather: serverWeather ?? fetched.weather, loading: needsBrowserLookup && !fetched.done };
}

interface Props {
  pincode: string;
  householdSize: number;
  /** The household's latest snapshots, oldest first. Two are enough. */
  snapshots: Snapshot[];
  serverWeather: Weather | null;
  /** Ids the server already produced, so nothing appears twice. */
  serverNudgeIds: string[];
}

/** Weather-driven tips computed in the browser, used only when the server had no forecast. */
function useBrowserNudges({ weather, serverWeather, householdSize, snapshots, serverNudgeIds }: Pick<Props, "householdSize" | "snapshots" | "serverWeather" | "serverNudgeIds"> & { weather: Weather | null }): Nudge[] {
  if (serverWeather || !weather) return [];
  return generateNudges({ householdSize, snapshots, now: new Date(), weather }).filter((n) => WEATHER_NUDGE_IDS.has(n.id) && !serverNudgeIds.includes(n.id));
}

/** Dashboard: the weather card, plus any weather tips the server could not make. */
export function LiveWeather(props: Props) {
  const { weather, loading } = useWeather(props.pincode, props.serverWeather);
  const extra = useBrowserNudges({ ...props, weather });
  if (loading) return null;
  return (
    <>
      <WeatherCard weather={weather} />
      {extra.length ? (
        <div style={{ marginTop: "16px" }}>
          <NudgeList nudges={extra} />
        </div>
      ) : null}
    </>
  );
}

/** Actions page: just the weather tips. Renders nothing when there are none. */
export function LiveWeatherNudges(props: Props) {
  const { weather } = useWeather(props.pincode, props.serverWeather);
  const extra = useBrowserNudges({ ...props, weather });
  return extra.length ? (
    <div style={{ marginTop: "16px" }}>
      <NudgeList nudges={extra} />
    </div>
  ) : null;
}
