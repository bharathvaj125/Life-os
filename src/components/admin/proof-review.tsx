"use client";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";
import type { PendingProof } from "@/services/proofs";

export function ProofReview({ proofs, canReview }: { proofs: PendingProof[]; canReview: boolean }) {
  const { pending, error, run } = useAction();
  const decide = (id: string, decision: "approved" | "rejected") => run(() => callApi(`/api/v1/admin/proofs/${id}`, "PATCH", { decision }));

  if (proofs.length === 0) return <p className="muted" style={{ margin: 0 }}>No photos are waiting.</p>;

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      {proofs.map((p) => (
        <div key={p.id} style={{ border: "1px solid var(--sand-200)", borderRadius: "12px", padding: "14px 16px", display: "grid", gap: "10px" }}>
          <div>
            <strong>{p.taskTitle}</strong> <span className="chip surya">+{p.points} pts</span>
            <p className="muted" style={{ margin: "4px 0 0", fontSize: "13.5px" }}>
              {p.displayName} · {p.pincode} · sent {new Date(p.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
            </p>
          </div>
          {/* A data URL from our own database, so the plain img tag is right here: there is nothing for the image optimiser to fetch. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt={`Photo for ${p.taskTitle} from ${p.displayName}`} style={{ maxWidth: "100%", maxHeight: "360px", borderRadius: "10px", objectFit: "contain", background: "var(--sand-50)" }} />
          <div className="toolbar">
            <Button type="button" disabled={pending || !canReview} onClick={() => decide(p.id, "approved")}>Approve and award points</Button>
            <Button type="button" disabled={pending || !canReview} onClick={() => decide(p.id, "rejected")}>Reject</Button>
          </div>
        </div>
      ))}
      <FormError message={error} />
    </div>
  );
}
