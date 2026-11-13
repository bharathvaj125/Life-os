"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { VENDOR_SERVICES } from "@/features/vendors/catalog";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";
import type { VendorService } from "@/types";

interface Props {
  initial: { name: string; city: string; pincode: string; services: VendorService[]; phone?: string; website?: string; empanelmentClaim?: string };
  readOnly: boolean;
}

/** The installer's listing. Saving sends it to an administrator again, so approved details cannot be swapped quietly. */
export function ListingForm({ initial, readOnly }: Props) {
  const { pending, error, run } = useAction();
  const [saved, setSaved] = useState(false);
  const [services, setServices] = useState<VendorService[]>(initial.services);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSaved(false);
    await run(
      () =>
        callApi("/api/v1/installer/listing", "PUT", {
          name: data.get("name"),
          city: data.get("city"),
          pincode: data.get("pincode"),
          services,
          phone: data.get("phone"),
          website: data.get("website"),
          empanelmentClaim: data.get("empanelmentClaim"),
        }),
      () => setSaved(true),
    );
  }

  const toggle = (s: VendorService) => setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  return (
    <form className="form" onSubmit={save} noValidate style={{ maxWidth: "none" }}>
      <Field label="Business name" name="name" defaultValue={initial.name} required minLength={3} maxLength={80} disabled={readOnly} />
      <div className="form-grid">
        <Field label="City" name="city" defaultValue={initial.city} required minLength={2} maxLength={40} disabled={readOnly} />
        <Field label="PIN code" name="pincode" defaultValue={initial.pincode} inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} required disabled={readOnly} />
      </div>
      <div>
        <p style={{ margin: "0 0 10px", fontWeight: 650, color: "var(--forest-900)", fontSize: "14px" }}>What you offer</p>
        <div className="choice-grid">
          {VENDOR_SERVICES.map((s) => (
            <button key={s.id} type="button" className="choice-card" aria-pressed={services.includes(s.id)} onClick={() => !readOnly && toggle(s.id)}>
              <strong>{s.label}</strong>
            </button>
          ))}
        </div>
      </div>
      <div className="form-grid">
        <Field label="Mobile number" name="phone" type="tel" inputMode="numeric" maxLength={10} defaultValue={initial.phone} disabled={readOnly} hint="10 digits. Add this or a website." />
        <Field label="Website" name="website" type="url" maxLength={200} defaultValue={initial.website} disabled={readOnly} placeholder="https://" />
      </div>
      <Field label="Empanelment or registration ID (optional)" name="empanelmentClaim" maxLength={120} defaultValue={initial.empanelmentClaim} disabled={readOnly} hint="Shown as self-declared. Citizens are told to verify it on the official lists." />

      <FormError message={error} />
      {saved ? (
        <div role="status" className="form-ok" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Check size={18} aria-hidden="true" /> Saved. An administrator will review the change before citizens see it.
        </div>
      ) : null}
      {readOnly ? (
        <p className="muted" style={{ margin: 0 }}>This is a shared demo account, so the listing is view only. Register your own business to manage a listing.</p>
      ) : (
        <div>
          <Button type="submit" disabled={pending || services.length === 0} className="button-surya">
            {pending ? "Saving…" : "Save and send for review"}
          </Button>
        </div>
      )}
    </form>
  );
}
