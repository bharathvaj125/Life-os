"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError, Stat } from "@/components/ui/field";
import type { SolarEstimate } from "@/lib/calculations/solar";
import { callApi } from "@/lib/client-api";
import { inr, inrRange, num, numRange } from "@/lib/format";
import { ArrowRight, Sun } from "lucide-react";

interface Props {
  defaultMonthlyKwh?: number;
  defaultTariff?: number;
  signedIn: boolean;
}

export function SolarCalculator({ defaultMonthlyKwh, defaultTariff, signedIn }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<SolarEstimate | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await callApi<{ estimate: SolarEstimate }>(
      "/api/v1/solar",
      "POST",
      Object.fromEntries(new FormData(e.currentTarget))
    );
    setPending(false);
    if (!result.ok) return setError(result.error);
    setEstimate(result.data.estimate);
    // Ticks the one-time "check rooftop solar" task for signed-in users
    if (signedIn) void callApi("/api/v1/tasks/solar-estimate/complete", "POST");
  }

  return (
    <>
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
                  note="PVGIS Western India irradiance model"
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
