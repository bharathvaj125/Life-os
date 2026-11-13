import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Camera, Eye, MapPin, Store, Trophy } from "lucide-react";
import { AdminTools } from "@/components/admin/admin-controls";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/field";
import { requireViewer } from "@/lib/auth/viewer";
import { getAdminSummary } from "@/services/admin";
import { listPendingProofs } from "@/services/proofs";
import { listPendingVendors } from "@/services/vendors";

export const metadata: Metadata = { title: "Administrator — Overview" };

export default async function AdminPage() {
  const viewer = await requireViewer("admin");
  const [s, pendingVendors, pendingProofs] = await Promise.all([getAdminSummary(), listPendingVendors(), listPendingProofs()]);

  return (
    <>
      <p className="eyebrow">State Administrator · Overview</p>
      <h1>Mission LiFE at a glance</h1>
      <p className="intro">
        Totals for the whole state, what is waiting for your review, and shortcuts to the area map, the community goals and the review queues. Areas with fewer than {s.k} households are never shown, so no household can be identified.
      </p>

      {viewer.operator ? (
        <AdminTools />
      ) : (
        <div className="callout surya" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Eye size={20} aria-hidden="true" />
          <span>You are using the demo administrator account, so you can look around but not change anything.</span>
        </div>
      )}

      <section className="stats" aria-label="Administrative totals">
        <Stat label="Total households" value={s.totalHouseholds} note={`${s.demoHouseholds} are seeded demo baselines`} />
        <Stat label="Active ward areas" value={s.rows.length - s.suppressedGroups} note={`${s.suppressedGroups} suppressed (fewer than ${s.k} households)`} />
        <Stat label="Vendor requests waiting" value={pendingVendors.length} tone={pendingVendors.length ? "warn" : undefined} note="Listings an administrator must review" />
        <Stat label="Photos waiting" value={pendingProofs.length} tone={pendingProofs.length ? "warn" : undefined} note="Proof for high-impact actions" />
      </section>

      <div className="grid">
        <Card title="Areas" icon={<MapPin size={20} className="card-icon" style={{ margin: 0 }} />}>
          <p style={{ marginTop: 0 }}>The state map and the table of postal wards, with small groups hidden.</p>
          <Link className="button button-outline" href="/admin/areas">Open areas <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </Card>
        <Card title="Challenges" icon={<Trophy size={20} className="card-icon" style={{ margin: 0 }} />}>
          <p style={{ marginTop: 0 }}>Every community goal and how far its members have got.</p>
          <Link className="button button-outline" href="/admin/challenges">Open challenges <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </Card>
        <Card title="Vendor listing requests" icon={<Store size={20} className="card-icon" style={{ margin: 0 }} />}>
          <p style={{ marginTop: 0 }}>{pendingVendors.length === 0 ? "No requests are waiting for review." : `${pendingVendors.length} ${pendingVendors.length === 1 ? "listing is" : "listings are"} waiting for review.`}</p>
          <Link className="button button-outline" href="/admin/vendors">Open the review queue <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </Card>
        <Card title="Photo proof" icon={<Camera size={20} className="card-icon" style={{ margin: 0 }} />}>
          <p style={{ marginTop: 0 }}>{pendingProofs.length === 0 ? "No photos are waiting for review." : `${pendingProofs.length} ${pendingProofs.length === 1 ? "photo is" : "photos are"} waiting for review.`}</p>
          <Link className="button button-outline" href="/admin/proofs">Open the photo queue <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </Card>
      </div>
    </>
  );
}
