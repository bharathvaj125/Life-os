"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { VENDOR_SERVICES } from "@/features/vendors/catalog";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";

export function VendorForm() {
  const { pending, error, run } = useAction();
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const body = {
      name: data.get("name"),
      city: data.get("city"),
      pincode: data.get("pincode"),
      services: data.getAll("services"),
      phone: data.get("phone"),
      website: data.get("website"),
      empanelmentClaim: data.get("empanelmentClaim"),
    };
    await run(
      () => callApi("/api/v1/vendors", "POST", body),
      () => {
        setSent(true);
        form.reset();
      },
    );
  }

  if (sent) {
    return (
      <div role="status">
        <p style={{ margin: "0 0 12px", fontWeight: 650 }}>Thank you. Your listing is waiting for review.</p>
        <Button type="button" onClick={() => setSent(false)}>Add another business</Button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field label="Business name" name="name" required minLength={3} maxLength={80} autoComplete="organization" />
      <div className="form-grid">
        <Field label="City" name="city" required minLength={2} maxLength={40} autoComplete="address-level2" />
        <Field label="PIN code" name="pincode" inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} required autoComplete="postal-code" />
      </div>
      <fieldset>
        <legend>What do you offer?</legend>
        <div style={{ display: "grid", gap: "10px" }}>
          {VENDOR_SERVICES.map((s) => (
            <label key={s.id} style={{ display: "flex", alignItems: "center" }}>
              <input type="checkbox" name="services" value={s.id} /> {s.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form-grid">
        <Field label="Mobile number" name="phone" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" hint="10 digits. Add this or a website." />
        <Field label="Website" name="website" type="url" placeholder="https://" maxLength={200} autoComplete="url" />
      </div>
      <Field label="Empanelment or registration ID (optional)" name="empanelmentClaim" maxLength={120} hint="Shown as self-declared. Citizens are told to verify it on the official list." />
      <FormError message={error} />
      <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Submit for review"}</Button>
    </form>
  );
}
