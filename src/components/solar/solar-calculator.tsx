"use client";

import { useState } from "react";
import { RoofMeasure } from "@/components/solar/roof-measure";
import { Button } from "@/components/ui/button";
import { Field, FormError, Stat } from "@/components/ui/field";
import type { SolarEstimate } from "@/lib/calculations/solar";
import { solarYieldTodayKwh, type Weather } from "@/lib/calculations/weather";
import { forecastUrl, parseForecast } from "@/lib/weather/open-meteo";
import { placeForPincode } from "@/lib/weather/places";
import { callApi } from "@/lib/client-api";
import { inr, inrRange, num, numRange } from "@/lib/format";
import { ArrowRight, Sun } from "lucide-react";

/** Asks our server first, which caches. If it has no forecast, asks the forecast service directly from the browser. */
async function loadWeather(pincode: string): Promise<Weather | null> {
  try {
    const res = await fetch(`/api/v1/weather?pincode=${pincode}`);
    const json = (await res.json()) as { data?: { weather: Weather | null } };
    if (json.data?.weather) return json.data.weather;
  } catch {
    // fall through to the direct lookup
  }
  const place = placeForPincode(pincode);
  if (!place) return null;
  try {
    const res = await fetch(forecastUrl(place));
    return res.ok ? parseForecast(await res.json(), place.city) : null;
  } catch {
    return null;
  }
}

interface Props {
  defaultMonthlyKwh?: number;
  defaultTariff?: number;
  defaultPincode?: string;
  signedIn: boolean;
  /** Where to start the roof-measuring map (the household's city). */
  roofCentre?: [number, number];
}

/** Puts a measured area into the roof box, the way typing it would, so the form and its checks see it. */
function fillRoofArea(areaM2: number) {
  const input = document.getElementById("roofAreaM2") as HTMLInputElement | null;
  if (!input) return;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, String(areaM2));
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function SolarCalculator({ defaultMonthlyKwh, defaultTariff, defaultPincode, signedIn, roofCentre }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<SolarEstimate | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { pincode, ...fields } = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const result = await callApi<{ estimate: SolarEstimate }>("/api/v1/solar", "POST", fields);
    if (!result.ok) {
      setPending(false);
      return setError(result.error);
    }
    // Local sunshine is a bonus: a failed or empty lookup just leaves the insight out.
    setWeather(null);
    if (/^[1-9]\d{5}$/.test(pincode ?? "")) setWeather(await loadWeather(pincode));
    setPending(false);
    setEstimate(result.data.estimate);
    // Ticks the one-time "check rooftop solar" task for signed-in users
    if (signedIn) void callApi("/api/v1/tasks/solar-estimate/complete", "POST");
  }

  return (
    <>
      {roofCentre ? (
        <div style={{ marginBottom: "22px" }}>
          <RoofMeasure centre={roofCentre} onUse={fillRoofArea} />
        </div>
      ) : null}
      <form onSubmit={submit} className="form" noValidate>
        <div className="form-grid">
          <Field
            label="Usable roof area (m²)"
            name="roofAreaM2"
            type="number"
            min={5}
            step="any"
            required
            placeholder="e.g. 45"
            hint="Shadow-free terrace or roof. 100 sq ft ≈ 9.3 m² · 500 sq ft ≈ 46.5 m²."
          />
          <Field
            label="Average monthly consumption (kWh)"
            name="monthlyKwh"
            type="number"
            min={10}
            step="any"
            defaultValue={defaultMonthlyKwh}
            required
            placeholder="e.g. 350"
            hint="Total units per month from your electricity bill."
          />
        </div>

        <div className="form-grid">
          <Field
            label="Current electricity tariff (₹ / unit)"
            name="tariffInrPerKwh"
            type="number"
            min={1}
            max={30}
            step="0.01"
            defaultValue={defaultTariff ?? 6}
            required
            hint="Bill amount ÷ units. We do not assume a fixed DISCOM tariff for you."
          />
          <div className="field">
            <label htmlFor="shade">Roof shading conditions</label>
            <select id="shade" name="shade" defaultValue="none">
              <option value="none">Little to no shade (Full sun)</option>
              <option value="partial">Partially shaded (Nearby trees / parapet)</option>
              <option value="heavy">Heavily shaded (Surrounding tall buildings)</option>
            </select>
            <small>Directly affects module generation yield.</small>
          </div>
        </div>

        <div className="form-grid">
          <Field
            label="PIN code (optional)"
            name="pincode"
            inputMode="numeric"
            pattern="[1-9][0-9]{5}"
            maxLength={6}
            defaultValue={defaultPincode}
            placeholder="e.g. 380015"
            hint="Adds today's local sunshine and expected generation for Gujarat cities."
          />
        </div>

        <FormError message={error} />

        <div>
          <Button type="submit" disabled={pending} className="button-surya" style={{ minWidth: "220px" }}>
            {pending ? "Running Feasibility Engine…" : "Calculate Rooftop Feasibility"} <ArrowRight size={16} />
          </Button>
        </div>
      </form>

      {estimate ? (
        <div className="result" aria-live="polite">
          {estimate.viable ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                <span className="badge" style={{ background: "var(--surya-50)", borderColor: "var(--surya-100)", color: "var(--surya-700)" }}>
                  <Sun size={14} /> Feasible Rooftop Installation
                </span>
                <span className="chip" style={{ fontSize: "12px" }}>
                  PM Surya Ghar Subsidy: <strong>{inr(estimate.subsidyInr)}</strong>
                </span>
              </div>

              <div className="stats">
                <Stat
                  label="Recommended System Size"
                  value={`${num(estimate.capacityKwp)} kWp`}
                  note={estimate.limitedBy === "roof" ? "Limited by available roof area" : "Sized to 100% of your usage"}
                />
                <Stat
                  label="Estimated Annual Generation"
                  value={`${numRange(estimate.annualKwh)} kWh`}
                  note="Typical Gujarat yield assumption"
                />
                <Stat
                  label="Annual Electricity Bill Savings"
                  value={inrRange(estimate.annualSavingsInr)}
                  tone="good"
                  note="Based on your inputted tariff"
                />
                <Stat
                  label="Simple Payback Period"
                  value={`${numRange(estimate.paybackYears)} yrs`}
                  note={`After ${inr(estimate.subsidyInr)} government subsidy`}
                  tone="good"
                />
              </div>

              {weather ? (
                <div className="callout surya" style={{ margin: "16px 0 0" }}>
                  <strong>Local solar insight, {weather.city}:</strong> with about {weather.today.sunshineHours} hours of sun forecast today, a{" "}
                  {num(estimate.capacityKwp)} kWp system would generate roughly{" "}
                  <strong>{solarYieldTodayKwh(estimate.capacityKwp, weather.today.radiationKwhM2)} kWh today</strong> (planning estimate from the day&apos;s forecast radiation,
                  weather data by Open-Meteo.com).
                </div>
              ) : null}

              <div style={{ background: "var(--sand-50)", border: "1px solid var(--sand-200)", borderRadius: "14px", padding: "18px 22px", margin: "16px 0 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <span style={{ fontSize: "13px", color: "var(--muted-text)" }}>Turnkey Gross Cost:</span>{" "}
                    <strong>{inrRange(estimate.costInr)}</strong>
                    <span style={{ margin: "0 10px", color: "var(--sand-300)" }}>|</span>
                    <span style={{ fontSize: "13px", color: "var(--muted-text)" }}>Net Cost to Citizen:</span>{" "}
                    <strong style={{ color: "var(--forest-800)", fontFamily: "JetBrains Mono, monospace" }}>
                      {inrRange(estimate.netCostInr)}
                    </strong>
                  </div>
                  <div>
                    <span className="chip" style={{ background: "var(--forest-50)", color: "var(--forest-800)" }}>
                      Avoids ~{numRange(estimate.co2AvoidedKgPerYear)} kg CO₂e / year
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="callout surya" style={{ marginBottom: "16px" }}>
              <strong>Not viable for grid-connected solar:</strong> System size would be below the 1 kWp minimum threshold under current DISCOM interconnection standards.
            </div>
          )}

          <div style={{ marginTop: "16px" }}>
            <h3 style={{ fontSize: "15px", color: "var(--forest-900)", marginBottom: "6px" }}>
              Estimation Assumptions & Regulatory Caveats:
            </h3>
            <ul className="notes">
              {estimate.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
