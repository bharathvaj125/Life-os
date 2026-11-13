import type { Metadata } from "next";
import Link from "next/link";
import { Check, ExternalLink, ShieldAlert, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { OFFICIAL_VENDOR_CHECKS } from "@/features/vendors/catalog";
import { requireViewer } from "@/lib/auth/viewer";
import { getListing } from "@/services/installer";

export const metadata: Metadata = { title: "Installer: get verified" };

export default async function InstallerTrustPage() {
  const { user } = await requireViewer("installer");
  if (!user) return null;
  const listing = await getListing(user);
  // What a citizen looks for before trusting a listing. These are checks on the listing, not on the business.
  const checks = [
    { ok: Boolean(listing), label: "You have a listing" },
    { ok: Boolean(listing?.phone || listing?.website), label: "A phone number or website is on it" },
    { ok: Boolean(listing?.empanelmentClaim), label: "Your registration or empanelment ID is quoted" },
    { ok: (listing?.services.length ?? 0) > 0, label: "Your services are chosen" },
    { ok: listing?.status === "approved", label: "An administrator has approved it" },
    { ok: Boolean(listing?.verifiedOn), label: "An administrator has found you on an official list" },
  ];
  const done = checks.filter((c) => c.ok).length;

  return (
    <>
      <p className="eyebrow">Installer · Get verified</p>
      <h1>Be easy to trust</h1>
      <p className="intro">For the central subsidy, citizens must use an empanelled installer, and they are told to check the official lists. Make it easy for them to find you there.</p>

      <Card title={`Your listing checklist (${done} of ${checks.length})`} className="card-accent-surya">
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "10px" }}>
          {checks.map((c) => (
            <li key={c.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className={`path-dot ${c.ok ? "" : "todo"}`} style={{ width: "28px", height: "28px" }}>
                {c.ok ? <Check size={15} aria-hidden="true" /> : <X size={15} aria-hidden="true" />}
              </span>
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: "16px" }}>
          <Link className="button button-outline" href="/installer/listing">{listing ? "Edit my listing" : "Create my listing"}</Link>
        </div>
      </Card>

      <Card title="Official lists citizens will check" icon={<ShieldAlert size={20} className="card-icon surya" style={{ margin: 0 }} />}>
        <p style={{ marginTop: 0 }}>A claim on a listing is not proof. Make sure you appear on these, and quote your registration ID in your listing.</p>
        <div style={{ display: "grid", gap: "12px" }}>
          {OFFICIAL_VENDOR_CHECKS.map((c) => (
            <a key={c.url} className="chip" href={c.url} target="_blank" rel="noopener noreferrer" style={{ justifyContent: "space-between", padding: "12px 16px" }}>
              <span><strong>{c.title}</strong><br /><span className="muted" style={{ fontSize: "12.5px" }}>{c.note}</span></span>
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ))}
        </div>
      </Card>
    </>
  );
}
