import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Clock, EyeOff, ExternalLink, MapPin, ShieldAlert, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/field";
import { OFFICIAL_VENDOR_CHECKS, serviceLabel } from "@/features/vendors/catalog";
import { requireViewer } from "@/lib/auth/viewer";
import { istHour } from "@/lib/dates";
import { getDemand, getListing } from "@/services/installer";

export const metadata: Metadata = { title: "Installer overview" };

const STATUS = {
  pending: { label: "Waiting for review", note: "An administrator will look at your listing soon. Citizens cannot see it yet.", icon: Clock },
  approved: { label: "Visible to citizens", note: "Your listing is in the vendor directory.", icon: BadgeCheck },
  rejected: { label: "Not approved", note: "An administrator did not approve this listing. Update the details and save to send it again.", icon: ShieldAlert },
} as const;

export default async function InstallerPage() {
  const { user } = await requireViewer("installer");
  if (!user) return null;
  const [listing, demand] = await Promise.all([getListing(user), getDemand(user)]);
  const hour = istHour(new Date());
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const status = listing ? STATUS[listing.status] : null;
  const StatusIcon = status?.icon ?? Store;

  return (
    <>
      <div className="greeting">
        <p className="eyebrow">Installer overview</p>
        <h1>
          {greeting}, <em>{user.displayName.replace(/\s*\(demo\)$/i, "")}</em>
        </h1>
        <p className="intro" style={{ marginBottom: 0 }}>Manage how citizens find you and see how much rooftop solar demand there is around you.</p>
      </div>

      <section className="path-card" aria-label="Your listing">
        <div className="path-head">
          <div>
            <p className="eyebrow">Your listing</p>
            <h2>{status ? status.label : "No listing yet"}</h2>
          </div>
          <Link className="button button-surya" href="/installer/listing">
            {listing ? "Edit my listing" : "Create my listing"} <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="path-steps" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
          <div className="path-step">
            <div className="path-step-top">
              <span className={`path-dot ${listing?.status === "approved" ? "" : "todo"}`}><StatusIcon size={18} aria-hidden="true" /></span>
              <div>
                <strong>{listing ? listing.name : "Add your business details"}</strong>
                <span className="sub">{status ? status.note : "Citizens only see businesses an administrator has approved."}</span>
              </div>
            </div>
            {listing ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                <span className="chip"><MapPin size={12} aria-hidden="true" /> {listing.city} · {listing.pincode}</span>
                {listing.services.map((s) => (
                  <span key={s} className="chip">{serviceLabel(s)}</span>
                ))}
                {listing.isSample ? <span className="chip warn">Demo listing</span> : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <h2 className="section-title" style={{ margin: "8px 0 4px" }}>Demand around {demand.areaLabel}</h2>
      {demand.visible ? (
        <>
          <section className="stats" aria-label="Local demand">
            <Stat label="Households using LiFE-OS" value={demand.households} note={`In ${demand.areaLabel}`} />
            <Stat label="Worth a conversation" value={demand.solarFit} note="Use 250 kWh or more, can use a roof, no solar yet" tone="good" />
            <Stat label="Average monthly use" value={`${demand.avgKwh} kWh`} note="Latest bill of each household" />
          </section>
          <p className="muted" style={{ fontSize: "13px" }}>Area totals only. Individual households are never listed or contacted through this page.</p>
        </>
      ) : (
        <Card title="Not enough households yet" icon={<EyeOff size={20} className="card-icon" style={{ margin: 0 }} />}>
          <p style={{ margin: 0 }}>
            Fewer than five households in {demand.areaLabel} use LiFE-OS so far. To protect their privacy, numbers appear once at least five do.
          </p>
        </Card>
      )}

      <Card title="Be easy to trust" icon={<ShieldAlert size={20} className="card-icon surya" style={{ margin: 0 }} />}>
        <p style={{ marginTop: 0 }}>
          For the central subsidy, citizens must use an empanelled installer. Make sure you are on the official lists, and quote your registration ID in your listing.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {OFFICIAL_VENDOR_CHECKS.map((c) => (
            <a key={c.url} className="chip" href={c.url} target="_blank" rel="noopener noreferrer" title={c.note}>
              {c.title} <ExternalLink size={12} aria-hidden="true" />
            </a>
          ))}
        </div>
      </Card>
    </>
  );
}
