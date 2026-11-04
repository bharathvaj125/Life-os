"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError, Stat } from "@/components/ui/field";
import type { SolarEstimate } from "@/lib/calculations/solar";
import { callApi } from "@/lib/client-api";
import { inr, inrRange, num, numRange } from "@/lib/format";

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
    const result = await callApi<{ estimate: SolarEstimate }>("/api/v1/solar", "POST", Object.fromEntries(new FormData(e.currentTarget)));
    setPending(false);
    if (!result.ok) return setError(result.error);
    setEstimate(result.data.estimate);
    // Ticks the one-time "check rooftop solar" task for signed-in users; already-done is not an error here.
    if (signedIn) void callApi("/api/v1/tasks/solar-estimate/complete", "POST");
  }

  return (
    <>
      <form onSubmit={submit} className="form" noValidate>
        <div className="form-grid">
          <Field label="Roof area (m²)" name="roofAreaM2" type="number" min={5} step="any" required hint="Shadow-free terrace or roof you could use. 1 m² ≈ 10.8 sq ft." />
          <Field label="Monthly units (kWh)" name="monthlyKwh" type="number" min={10} step="any" defaultValue={defaultMonthlyKwh} required />
        </div>
        <div className="form-grid">
          <Field label="Your rate (₹ per unit)" name="tariffInrPerKwh" type="number" min={1} max={30} step="0.01" defaultValue={defaultTariff ?? 6} required hint="Bill amount ÷ units. We do not assume a tariff for you." />
          <div className="field">
            <label htmlFor="shade">Shade on the roof</label>
            <select id="shade" name="shade" defaultValue="none">
              <option value="none">Little or none</option>
              <option value="partial">Partly shaded</option>
              <option value="heavy">Heavily shaded</option>
            </select>
          </div>
        </div>
        <FormError message={error} />
        <Button type="submit" disabled={pending}>{pending ? "Estimating…" : "Estimate rooftop solar"}</Button>
      </form>

      {estimate ? (
        <div className="result" aria-live="polite">
          {estimate.viable ? (
            <>
              <div className="stats">
                <Stat label="Suggested system" value={`${num(estimate.capacityKwp)} kWp`} note={estimate.limitedBy === "roof" ? "Limited by roof area" : "Sized to your usage"} />
                <Stat label="Yearly generation" value={`${numRange(estimate.annualKwh)} kWh`} />
                <Stat label="Yearly bill saving" value={inrRange(estimate.annualSavingsInr)} tone="good" />
                <Stat label="Payback" value={`${numRange(estimate.paybackYears)} yrs`} note={`After ${inr(estimate.subsidyInr)} assumed subsidy`} />
              </div>
              <p>Installed cost about <strong>{inrRange(estimate.costInr)}</strong>, so roughly <strong>{inrRange(estimate.netCostInr)}</strong> after subsidy. Avoids around {numRange(estimate.co2AvoidedKgPerYear)} kg CO₂e a year.</p>
            </>
          ) : null}
          <ul className="notes">{estimate.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </div>
      ) : null}
    </>
  );
}
