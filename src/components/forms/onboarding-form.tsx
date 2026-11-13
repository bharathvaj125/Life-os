"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";
import { EMISSION_FACTORS } from "@/lib/calculations/emission-factors";
import { Sparkles, Shield, ArrowRight } from "lucide-react";

export function OnboardingForm() {
  const { pending, error, run, router } = useAction();
  const [kwh, setKwh] = useState<number | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    await run(
      () => callApi("/api/v1/session", "POST", body),
      () => router.push("/dashboard")
    );
  }

  const estimatedBaselineKg = kwh && kwh > 0 ? Math.round(kwh * EMISSION_FACTORS.electricityKgPerKwh * 10) / 10 : null;

  return (
    <form onSubmit={submit} className="form" noValidate>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <Sparkles size={18} style={{ color: "var(--surya-600)" }} />
        <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--forest-800)" }}>Household Identity</span>
      </div>

      <Field
        label="Your full or display name"
        name="displayName"
        autoComplete="given-name"
        required
        minLength={2}
        maxLength={40}
        placeholder="e.g. Aarav Patel"
        hint="Only shown on neighborhood leaderboards if you explicitly opt in."
      />

      <div className="form-grid">
        <Field
          label="Postal PIN code (6 digits)"
          name="pincode"
          inputMode="numeric"
          pattern="[1-9][0-9]{5}"
          maxLength={6}
          placeholder="e.g. 380015"
          required
          hint="Connects you to local ward challenges (e.g. Gujarat PINs 380xxx)."
        />
        <Field
          label="People in your household"
          name="householdSize"
          type="number"
          min={1}
          max={20}
          defaultValue={4}
          required
          hint="Used to calculate fair per-capita emissions."
        />
      </div>

      <div style={{ marginTop: "12px", borderTop: "1px solid var(--sand-200)", paddingTop: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--forest-800)" }}>
            ⚡ Last Month&apos;s Electricity Bill
          </span>
        </div>

        <div className="form-grid">
          <Field
            label="Electricity units consumed (kWh)"
            name="electricityKwh"
            type="number"
            min={1}
            step="any"
            placeholder="e.g. 240"
            required
            onChange={(e) => setKwh(e.target.value ? Number(e.target.value) : null)}
            hint="Printed as 'Units / kWh' on your DISCOM bill."
          />
          <Field
            label="Total bill amount (₹, optional)"
            name="billAmountInr"
            type="number"
            min={0}
            step="any"
            placeholder="e.g. 1500"
            hint="Helps calculate realistic rupee savings and solar payback."
          />
        </div>
      </div>

      {estimatedBaselineKg !== null ? (
        <div className="preview" role="status" aria-live="polite">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>
              ⚡ Estimated initial electricity footprint: <strong>{estimatedBaselineKg} kg CO₂e / month</strong>
            </span>
            <span className="chip" style={{ fontSize: "11px", background: "#FFFFFF" }}>
              CEA grid average
            </span>
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: "12px", borderTop: "1px solid var(--sand-200)", paddingTop: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--forest-800)" }}>🔑 Save your progress (optional)</span>
        </div>
        <p className="muted" style={{ margin: "0 0 12px", fontSize: "13px" }}>
          Add an email and password to sign back in from any phone or laptop. Skip it and you can still start now, but you will only be remembered on this browser.
        </p>
        <div className="form-grid">
          <Field label="Email" name="email" type="email" autoComplete="email" maxLength={120} placeholder="you@example.com" />
          <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} hint="At least 8 characters." />
        </div>
      </div>

      <FormError message={error} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", fontSize: "12.5px", color: "var(--muted-light)" }}>
          <Shield size={14} /> Account optional · Protected session
        </div>
        <Button type="submit" disabled={pending} className="button-surya" style={{ minWidth: "220px" }}>
          {pending ? "Calculating Baseline…" : "Generate My Footprint"} <ArrowRight size={16} />
        </Button>
      </div>
    </form>
  );
}
