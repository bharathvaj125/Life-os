"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { calculateFootprint } from "@/lib/calculations/footprint";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";

const num = (v: FormDataEntryValue | null) => (v === null || v === "" ? 0 : Number(v));

export function FootprintForm({ defaultPeriod }: { defaultPeriod: string }) {
  const { pending, error, run, router } = useAction();
  const [preview, setPreview] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  function readInputs(form: HTMLFormElement) {
    const f = new FormData(form);
    return { electricityKwh: num(f.get("electricityKwh")), lpgCylinders: num(f.get("lpgCylinders")), carKm: num(f.get("carKm")), bikeKm: num(f.get("bikeKm")), publicKm: num(f.get("publicKm")) };
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    setSaved(false);
    await run(() => callApi("/api/v1/footprint", "POST", body), () => {
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} onChange={(e) => setPreview(calculateFootprint(readInputs(e.currentTarget)).totalKg)} className="form" noValidate>
      <div className="form-grid">
        <Field label="Billing month" name="period" type="month" defaultValue={defaultPeriod} max={defaultPeriod} required hint="Saving a month again replaces it." />
        <Field label="Electricity units (kWh)" name="electricityKwh" type="number" min={1} step="any" required />
      </div>
      <div className="form-grid">
        <Field label="Bill amount (₹, optional)" name="billAmountInr" type="number" min={0} step="any" />
        <Field label="LPG cylinders used" name="lpgCylinders" type="number" min={0} max={10} step="0.25" defaultValue={0} />
      </div>
      <fieldset>
        <legend>Travel this month (km, optional)</legend>
        <div className="form-grid three">
          <Field label="By car" name="carKm" type="number" min={0} step="any" defaultValue={0} />
          <Field label="By two-wheeler" name="bikeKm" type="number" min={0} step="any" defaultValue={0} />
          <Field label="Bus / metro / train" name="publicKm" type="number" min={0} step="any" defaultValue={0} />
        </div>
      </fieldset>
      {preview !== null ? <p className="preview" aria-live="polite">Estimate so far: <strong>{preview} kg CO₂e</strong> this month</p> : null}
      <FormError message={error} />
      {saved ? <p role="status" className="form-ok">Saved.</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save this month"}</Button>
    </form>
  );
}
