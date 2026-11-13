"use client";

import { useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";

export interface VerifyItem {
  id: string;
  name: string;
  city: string;
  pincode: string;
  claim?: string;
  phone?: string;
  website?: string;
  status: "pending" | "approved" | "rejected";
  verifiedOn?: string;
  verifiedNote?: string;
  /** Other listings quoting the same registration text. A real ID belongs to one business. */
  sameClaimAs: string[];
}

function Row({ item, canReview }: { item: VerifyItem; canReview: boolean }) {
  const { pending, error, run } = useAction();
  const [note, setNote] = useState("");
  return (
    <div style={{ border: "1px solid var(--sand-200)", borderRadius: "12px", padding: "14px 16px", display: "grid", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
        <div>
          <strong>{item.name}</strong>
          <p className="muted" style={{ margin: "2px 0 0", fontSize: "13px" }}>
            {item.city} · {item.pincode} · {[item.phone, item.website].filter(Boolean).join(" · ") || "no contact details"} · listing {item.status}
          </p>
        </div>
        {item.verifiedOn ? <span className="chip" style={{ background: "var(--forest-50)", color: "var(--forest-800)" }}><ShieldCheck size={12} aria-hidden="true" /> Checked {item.verifiedOn}</span> : <span className="chip warn"><ShieldOff size={12} aria-hidden="true" /> Not checked on an official list</span>}
      </div>
      <p style={{ margin: 0, fontSize: "13.5px" }}>
        Claims: {item.claim ? <>&ldquo;{item.claim}&rdquo;</> : <em>no registration or empanelment ID given</em>}
      </p>
      {item.sameClaimAs.length ? (
        <p role="alert" className="form-error" style={{ margin: 0 }}>
          Another listing quotes the same ID text ({item.sameClaimAs.join(", ")}). Only one business can hold an ID, so one of them may be pretending.
        </p>
      ) : null}
      {item.verifiedOn ? (
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <span className="muted" style={{ fontSize: "13px" }}>Your note: {item.verifiedNote}</span>
          <Button type="button" disabled={pending || !canReview} onClick={() => run(() => callApi(`/api/v1/admin/vendors/${item.id}/verify`, "DELETE"))}>Remove check</Button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "end" }}>
          <div className="field" style={{ flex: "1 1 260px" }}>
            <label htmlFor={`vn-${item.id}`}>Where did you find them?</label>
            <input id={`vn-${item.id}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="e.g. On the PGVCL list, ID matches, 14 Nov" />
          </div>
          <Button type="button" disabled={pending || !canReview || note.trim().length < 5} onClick={() => run(() => callApi(`/api/v1/admin/vendors/${item.id}/verify`, "POST", { note }))}>Mark as checked</Button>
        </div>
      )}
      <FormError message={error} />
    </div>
  );
}

/** Where an administrator records that an installer was found on an official list. The check itself is done by a person on the official site. */
export function VendorVerify({ items, canReview }: { items: VerifyItem[]; canReview: boolean }) {
  if (items.length === 0) return <p className="muted" style={{ margin: 0 }}>No installer accounts have a listing yet.</p>;
  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {items.map((i) => (
        <Row key={i.id} item={i} canReview={canReview} />
      ))}
    </div>
  );
}
