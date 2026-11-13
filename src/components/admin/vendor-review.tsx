"use client";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { serviceLabel } from "@/features/vendors/catalog";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";
import type { Vendor } from "@/types";

export function VendorReview({ vendors }: { vendors: Vendor[] }) {
  const { pending, error, run } = useAction();
  const decide = (id: string, decision: "approved" | "rejected") => run(() => callApi(`/api/v1/admin/vendors/${id}`, "PATCH", { decision }));

  if (vendors.length === 0) return <p className="muted" style={{ margin: 0 }}>No vendor requests are waiting.</p>;

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      {vendors.map((v) => (
        <div key={v.id} style={{ border: "1px solid var(--sand-200)", borderRadius: "12px", padding: "14px 16px" }}>
          <strong>{v.name}</strong>
          <p className="muted" style={{ margin: "4px 0 8px", fontSize: "13.5px" }}>
            {v.city} · {v.pincode} · {v.services.map(serviceLabel).join(", ")}
          </p>
          <p style={{ margin: "0 0 10px", fontSize: "13.5px" }}>
            {[v.phone, v.website, v.empanelmentClaim ? `Claims: ${v.empanelmentClaim}` : null].filter(Boolean).join(" · ")}
          </p>
          <div className="toolbar">
            <Button type="button" disabled={pending} onClick={() => decide(v.id, "approved")}>Approve</Button>
            <Button type="button" disabled={pending} onClick={() => decide(v.id, "rejected")}>Reject</Button>
          </div>
        </div>
      ))}
      <FormError message={error} />
    </div>
  );
}
