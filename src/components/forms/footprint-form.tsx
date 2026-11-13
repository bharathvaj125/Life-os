"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { TermHelp } from "@/components/ui/term-help";
import { EMISSION_FACTORS } from "@/lib/calculations/emission-factors";
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

/**
 * A monthly kilometre box with a way out for people who do not know their month: type the kilometres of a
 * usual day and the number of days, and the monthly figure is filled in. The box stays editable afterwards.
 * Only the monthly input has a name, so only it is sent to the server.
 */
function TravelField({ name, label, hint }: { name: string; label: string; hint: string }) {
  const id = useId();
  const monthly = useRef<HTMLInputElement>(null);
  const [perDay, setPerDay] = useState("");
  const [days, setDays] = useState("26");

  function fill(perDayValue: string, daysValue: string) {
    const total = Math.round(Number(perDayValue || 0) * Number(daysValue || 0) * 10) / 10;
    const el = monthly.current;
    if (!el || !Number.isFinite(total)) return;
    // A real input event, so the form's live estimate recalculates as it does when a person types.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(el, String(total));
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  return (
    <div className="field">
      <label htmlFor={`${id}-m`}>{label}</label>
      <input id={`${id}-m`} ref={monthly} name={name} type="number" min={0} step="any" defaultValue={0} aria-describedby={`${id}-hint`} />
      <small id={`${id}-hint`}>{hint}</small>
      <details className="travel-helper">
        <summary>Not sure about the month? Work it out from a usual day</summary>
        <div className="travel-helper-grid">
          <div>
            <label htmlFor={`${id}-d`}>Km on a usual day</label>
            <input id={`${id}-d`} type="number" min={0} step="any" inputMode="decimal" placeholder="e.g. 12" value={perDay} onChange={(e) => { setPerDay(e.target.value); fill(e.target.value, days); }} />
          </div>
          <div>
            <label htmlFor={`${id}-n`}>Days a month</label>
            <input id={`${id}-n`} type="number" min={1} max={31} step={1} inputMode="numeric" value={days} onChange={(e) => { setDays(e.target.value); fill(perDay, e.target.value); }} />
          </div>
        </div>
        <small>Most people travel 22 to 26 days a month. The monthly box above fills in for you.</small>
      </details>
    </div>
  );
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
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              Billing month
            </span>
          }
          name="period"
          type="month"
          defaultValue={defaultPeriod}
          max={defaultPeriod}
          required
          hint="Re-saving an existing month updates your previous record."
        />
        <Field
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              Electricity units (kWh)
              <TermHelp termKey="kwh" />
            </span>
          }
          name="electricityKwh"
          type="number"
          min={1}
          step="any"
          required
          placeholder="e.g. 210"
          hint="Typical: 150–250 kWh/mo (2BHK flat); 350+ kWh with summer AC."
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
            hint={`1 cylinder lasts about 30-45 days for 4 people (${EMISSION_FACTORS.lpgKgPerCylinder} kg CO₂ per cylinder).`}
          />
        ) : null}
      </div>

      <fieldset>
        <legend style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>Monthly Travel &amp; Mobility (km, optional)</span>
          <TermHelp termKey="co2" />
        </legend>
        <div className="form-grid three" style={{ marginTop: "10px" }}>
          {show.car ? (
            <TravelField
              label="Petrol / diesel car"
              name="carKm"
              hint={`e.g. 15 km/day is about 300 km a month (about ${Math.round(300 * EMISSION_FACTORS.carKgPerKm)} kg CO₂ at ${EMISSION_FACTORS.carKgPerKm} kg per km).`}
            />
          ) : null}
          {show.bike ? (
            <TravelField
              label="Motorcycle / scooter"
              name="bikeKm"
              hint={`e.g. 10 km/day is about 200 km a month (about ${Math.round(200 * EMISSION_FACTORS.bikeKgPerKm)} kg CO₂ at ${EMISSION_FACTORS.bikeKgPerKm} kg per km).`}
            />
          ) : null}
          <TravelField
            label="Bus / metro / train"
            name="publicKm"
            hint={`Lowest emissions per km (${EMISSION_FACTORS.publicKgPerKm} kg CO₂ per passenger-km).`}
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
