"use client";

import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";

export function OnboardingForm() {
  const { pending, error, run, router } = useAction();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    await run(() => callApi("/api/v1/session", "POST", body), () => router.push("/dashboard"));
  }

  return (
    <form onSubmit={submit} className="form" noValidate>
      <Field label="Your name" name="displayName" autoComplete="given-name" required minLength={2} maxLength={40} hint="Only shown on leaderboards if you opt in." />
      <div className="form-grid">
        <Field label="PIN code" name="pincode" inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} required hint="Used to find local challenges." />
        <Field label="People in your home" name="householdSize" type="number" min={1} max={20} defaultValue={4} required />
      </div>
      <div className="form-grid">
        <Field label="Units on last bill (kWh)" name="electricityKwh" type="number" min={1} step="any" required hint="Found on your electricity bill." />
        <Field label="Bill amount (₹, optional)" name="billAmountInr" type="number" min={0} step="any" hint="Lets us show savings in rupees." />
      </div>
      <FormError message={error} />
      <Button type="submit" disabled={pending}>{pending ? "Calculating…" : "Calculate my footprint"}</Button>
    </form>
  );
}
