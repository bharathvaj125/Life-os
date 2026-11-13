import type { Metadata } from "next";
import { Eye, ExternalLink, ShieldCheck, Store } from "lucide-react";
import { VendorReview } from "@/components/admin/vendor-review";
import { VendorVerify, type VerifyItem } from "@/components/admin/vendor-verify";
import { Card } from "@/components/ui/card";
import { OFFICIAL_VENDOR_CHECKS, serviceLabel } from "@/features/vendors/catalog";
import { requireViewer } from "@/lib/auth/viewer";
import { listAllVendors } from "@/services/vendors";

export const metadata: Metadata = { title: "Administrator — Vendor review" };

const STATUS_LABEL = { pending: "Waiting", approved: "Public", rejected: "Rejected" } as const;

export default async function AdminVendorsPage() {
  const viewer = await requireViewer("admin");
  const all = await listAllVendors();
  const pending = all.filter((v) => v.status === "pending");
  // Real installer accounts only: public bodies and samples are not self-registered.
  const installers = all.filter((v) => !v.isSample && (v.listingKind ?? "installer") === "installer");
  const norm = (s?: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const verifyItems: VerifyItem[] = installers.map((v) => ({
    id: v.id,
    name: v.name,
    city: v.city,
    pincode: v.pincode,
    claim: v.empanelmentClaim,
    phone: v.phone,
    website: v.website,
    status: v.status,
    verifiedOn: v.verifiedOn,
    verifiedNote: v.verifiedNote,
    sameClaimAs: norm(v.empanelmentClaim).length >= 4 ? installers.filter((o) => o.id !== v.id && norm(o.empanelmentClaim) === norm(v.empanelmentClaim)).map((o) => o.name) : [],
  }));

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

      <Card title="Check installers against the official lists" icon={<ShieldCheck size={20} className="card-icon" style={{ margin: 0 }} />}>
        <p style={{ marginTop: 0 }}>
          Anyone can type a registration ID, so an ID on a listing is not proof. For each installer, find the business on an official list yourself, make sure the name and ID match, and record where you found it. Citizens then see a &ldquo;Checked on an official list&rdquo; badge with the date. The official lists have no feed we can read automatically, so the check is yours.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          {OFFICIAL_VENDOR_CHECKS.map((c) => (
            <a key={c.url} className="chip" href={c.url} target="_blank" rel="noopener noreferrer" title={c.note}>
              {c.title} <ExternalLink size={12} aria-hidden="true" />
            </a>
          ))}
        </div>
        <VendorVerify items={verifyItems} canReview={viewer.operator} />
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
