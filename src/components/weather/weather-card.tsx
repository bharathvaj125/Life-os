import { CloudSun } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/field";
import { describeToday, solarYieldTodayKwh, type Weather } from "@/lib/calculations/weather";

/** Today's forecast and what it means for solar. Renders a quiet fallback when no forecast is available. */
export function WeatherCard({ weather }: { weather: Weather | null }) {
  if (!weather) {
    return (
      <Card title="Today's weather" icon={<CloudSun size={20} className="card-icon" style={{ margin: 0 }} />}>
        <p className="muted" style={{ margin: 0 }}>
          Live weather is not available right now. It covers Gujarat PIN codes and needs an internet connection. Everything else works without it.
        </p>
      </Card>
    );
  }

  const { tone, label } = describeToday(weather);
  const perKwp = solarYieldTodayKwh(1, weather.today.radiationKwhM2);
  return (
    <Card
      title={`Today in ${weather.city}`}
      icon={<CloudSun size={20} className="card-icon surya" style={{ margin: 0 }} />}
      badge={<span className={`chip${tone === "hot" ? " warn" : ""}`}>{label}</span>}
    >
      <section className="stats" aria-label="Today's weather" style={{ marginBottom: "14px" }}>
        <Stat label="Now" value={`${Math.round(weather.tempC)} °C`} note={`Feels like ${Math.round(weather.feelsLikeC)} °C · ${weather.cloudPct}% cloud`} />
        <Stat label="Today's high" value={`${Math.round(weather.today.maxC)} °C`} />
        <Stat label="Sunshine today" value={`${weather.today.sunshineHours} h`} note="Forecast hours of direct sun" />
        <Stat label="Solar radiation" value={`${weather.today.radiationKwhM2} kWh/m²`} note="Daily total on a flat surface" />
      </section>
      <p style={{ margin: "0 0 8px" }}>
        <strong>Solar insight:</strong> a 1 kWp rooftop system would generate about <strong>{perKwp} kWh</strong> today in {weather.city}. Try the estimator on the{" "}
        <a className="text-link" href="/resources">Solar &amp; Hub page</a>.
      </p>
      <p className="muted" style={{ margin: 0, fontSize: "12.5px" }}>
        City-level forecast, not a measurement at your roof. Weather data by{" "}
        <a className="text-link" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo.com</a> (CC BY 4.0).
      </p>
    </Card>
  );
}
