"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { calculateFootprint } from "@/lib/calculations/footprint";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";
import type { BillSavingsBonus } from "@/lib/calculations/bill-savings";
import { CheckCircle2, Sparkles } from "lucide-react";

const num = (v: FormDataEntryValue | null) => (v === null || v === "" ? 0 : Number(v));

export interface FootprintFields {
  lpg: boolean;
  car: boolean;
  bike: boolean;
}

/** Only asks about what the home has. `show` is all true when the equipment is unknown. */
export function FootprintForm({ defaultPeriod, show }: { defaultPeriod: string; show: FootprintFields }) {
  const { pending, error, run, router } = useAction();
  const [breakdown, setBreakdown] = useState<{
    electricityKg: number;
    commuteKg: number;
    lpgKg: number;
    totalKg: number;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const [bonus, setBonus] = useState<BillSavingsBonus | null>(null);

  function readInputs(form: HTMLFormElement) {
    const f = new FormData(form);
    return {
      electricityKwh: num(f.get("electricityKwh")),
      billAmountInr: num(f.get("billAmountInr")),
      lpgCylinders: num(f.get("lpgCylinders")),
      carKm: num(f.get("carKm")),
      bikeKm: num(f.get("bikeKm")),
      publicKm: num(f.get("publicKm")),
    };
  }

  function handleFormChange(e: React.FormEvent<HTMLFormElement>) {
    const data = readInputs(e.currentTarget);
    const calculated = calculateFootprint(data);
    setBreakdown({
      electricityKg: calculated.electricityKg,
      commuteKg: calculated.commuteKg,
      lpgKg: calculated.lpgKg,
      totalKg: calculated.totalKg,
    });
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    setSaved(false);
    setBonus(null);
    await run(
      () => callApi<{ bonus: BillSavingsBonus | null }>("/api/v1/footprint", "POST", body),
      (data) => {
        setSaved(true);
        setBonus(data.bonus);
        router.refresh();
      }
    );
  }

  return (
    <form onSubmit={submit} onChange={handleFormChange} className="form" noValidate>
      <div className="form-grid">
        <Field
          label="Billing month"
          name="period"
          type="month"
          defaultValue={defaultPeriod}
          max={defaultPeriod}
          required
          hint="Re-saving an existing month updates your previous record."
        />
        <Field
          label="Electricity units (kWh)"
          name="electricityKwh"
          type="number"
          min={1}
          step="any"
          required
          placeholder="e.g. 210"
          hint="Primary driver of household scope-2 carbon emissions."
        />
      </div>

      <div className="form-grid">
        <Field
          label="Bill amount (₹, optional)"
          name="billAmountInr"
          type="number"
          min={0}
          step="any"
          placeholder="e.g. 1450"
          hint="Used to compute rupee/kWh tariff and rooftop solar savings."
        />
        {show.lpg ? (
          <Field
            label="LPG cylinders used (14.2 kg)"
            name="lpgCylinders"
            type="number"
            min={0}
            max={10}
            step="0.25"
            defaultValue={0}
            hint="42.3 kg CO₂ per standard cylinder."
          />
        ) : null}
      </div>

      <fieldset>
        <legend style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>Monthly Travel & Mobility (km, optional)</span>
        </legend>
        <div className="form-grid three" style={{ marginTop: "10px" }}>
          {show.car ? (
            <Field
              label="Petrol / diesel car"
              name="carKm"
              type="number"
              min={0}
              step="any"
              defaultValue={0}
              hint="0.17 kg CO₂ / km"
            />
          ) : null}
          {show.bike ? (
            <Field
              label="Motorcycle / scooter"
              name="bikeKm"
              type="number"
              min={0}
              step="any"
              defaultValue={0}
              hint="0.04 kg CO₂ / km"
            />
          ) : null}
          <Field
            label="Bus / metro / train"
            name="publicKm"
            type="number"
            min={0}
            step="any"
            defaultValue={0}
            hint="0.02 kg CO₂ / km"
          />
        </div>
      </fieldset>

      {breakdown !== null ? (
        <div className="preview" aria-live="polite">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--forest-900)" }}>
              Live Calculation Estimate:
            </span>
            <strong style={{ fontSize: "18px", fontFamily: "JetBrains Mono, monospace", color: "var(--forest-900)" }}>
              {breakdown.totalKg} kg CO₂e
            </strong>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "12px" }}>
            <span className="chip" style={{ background: "var(--card-bg)" }}>
              ⚡ Electricity: {breakdown.electricityKg} kg
            </span>
            <span className="chip" style={{ background: "var(--card-bg)" }}>
              🚗 Travel: {breakdown.commuteKg} kg
            </span>
            <span className="chip" style={{ background: "var(--card-bg)" }}>
              🔥 LPG: {breakdown.lpgKg} kg
            </span>
          </div>
        </div>
      ) : null}

      <FormError message={error} />

      {saved ? (
        <div role="status" className="form-ok" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={18} />
          <span>Billing month recorded successfully. Your history and trend charts are updated.</span>
        </div>
      ) : null}

      {bonus ? (
        <div role="status" className="callout" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Sparkles size={20} style={{ color: "var(--forest-600)", flexShrink: 0 }} />
          <span>
            <strong>Bill savings bonus: +{bonus.points} points.</strong> Your units fell {bonus.reductionPct}% from last month ({bonus.kwhSaved} kWh, about {bonus.impactKg} kg CO₂e avoided).
          </span>
        </div>
      ) : null}

      <Button type="submit" disabled={pending} className="button-surya">
        {pending ? "Saving Entry…" : "Save Month's Record"}
      </Button>
    </form>
  );
}
