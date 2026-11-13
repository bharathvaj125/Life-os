import type { Metadata } from "next";
import { Eye, Store } from "lucide-react";
import { VendorReview } from "@/components/admin/vendor-review";
import { Card } from "@/components/ui/card";
import { serviceLabel } from "@/features/vendors/catalog";
import { requireViewer } from "@/lib/auth/viewer";
import { listAllVendors } from "@/services/vendors";

export const metadata: Metadata = { title: "Administrator — Vendor review" };

const STATUS_LABEL = { pending: "Waiting", approved: "Public", rejected: "Rejected" } as const;

export default async function AdminVendorsPage() {
  const viewer = await requireViewer("admin");
  const all = await listAllVendors();
  const pending = all.filter((v) => v.status === "pending");

  return (
    <>
      <p className="eyebrow">State Administrator · Vendor review</p>
      <h1>Vendor listings</h1>
      <p className="intro">
        Installers register themselves. A listing only appears for citizens after you approve it, and any later change by the installer sends it back here.
      </p>

      {viewer.operator ? null : (
        <div className="callout surya" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Eye size={20} aria-hidden="true" />
          <span>You are using the demo administrator account, so the buttons are switched off.</span>
        </div>
      )}

      <Card title={`Waiting for review (${pending.length})`} icon={<Store size={20} className="card-icon" style={{ margin: 0 }} />} className="card-accent-surya">
        <VendorReview vendors={pending} canReview={viewer.operator} />
      </Card>

      <Card title={`All listings (${all.length})`}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Business</th>
                <th>Where</th>
                <th>Offers</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {all.map((v) => (
                <tr key={v.id}>
                  <td>
                    <strong>{v.name}</strong>
                    {v.isSample ? <span className="chip warn" style={{ marginLeft: "8px" }}>Sample</span> : null}
                  </td>
                  <td>{v.city} · {v.pincode}</td>
                  <td>{v.services.map(serviceLabel).join(", ")}</td>
                  <td>{STATUS_LABEL[v.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
