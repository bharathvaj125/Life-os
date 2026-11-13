import type { Metadata } from "next";
import { Camera, Eye } from "lucide-react";
import { ProofReview } from "@/components/admin/proof-review";
import { Card } from "@/components/ui/card";
import { requireViewer } from "@/lib/auth/viewer";
import { listPendingProofs } from "@/services/proofs";

export const metadata: Metadata = { title: "Administrator — Photo review" };

export default async function AdminProofsPage() {
  const viewer = await requireViewer("admin");
  const proofs = await listPendingProofs();

  return (
    <>
      <p className="eyebrow">State Administrator · Photo review</p>
      <h1>Photo proof for high-impact actions</h1>
      <p className="intro">
        Replacing bulbs, buying a 5-star appliance or installing rooftop solar earns points only after you have looked at a photo. Approving awards the points and shows a &quot;Verified citizen&quot; badge on the leaderboard. The photo is deleted as soon as you decide, either way.
      </p>

      {viewer.operator ? null : (
        <div className="callout surya" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Eye size={20} aria-hidden="true" />
          <span>You are using the demo administrator account, so the buttons are switched off.</span>
        </div>
      )}

      <Card title={`Waiting for review (${proofs.length})`} icon={<Camera size={20} className="card-icon" style={{ margin: 0 }} />} className="card-accent-surya">
        <ProofReview proofs={proofs} canReview={viewer.operator} />
      </Card>
    </>
  );
}
