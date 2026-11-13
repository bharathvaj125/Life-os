import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Clock, MapPin, MessageSquare, ShieldAlert, ShieldCheck, Store, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/field";
import { serviceLabel } from "@/features/vendors/catalog";
import { requireViewer } from "@/lib/auth/viewer";
import { istHour } from "@/lib/dates";
import { getDemand, getListing } from "@/services/installer";
import { listInstallerQuotes } from "@/services/quotes";

export const metadata: Metadata = { title: "Installer overview" };

const STATUS = {
  pending: { label: "Waiting for review", note: "An administrator will look at your listing soon. Citizens cannot see it yet.", icon: Clock },
  approved: { label: "Visible to citizens", note: "Your listing is in the vendor directory.", icon: BadgeCheck },
  rejected: { label: "Not approved", note: "An administrator did not approve this listing. Update the details and save to send it again.", icon: ShieldAlert },
} as const;

export default async function InstallerPage() {
  const { user } = await requireViewer("installer");
  if (!user) return null;
  const [listing, demand, threads] = await Promise.all([getListing(user), getDemand(user), listInstallerQuotes(user)]);
  const waiting = threads.filter((t) => t.waitingOnYou).length;
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

      <h2 className="section-title" style={{ margin: "8px 0 4px" }}>At a glance</h2>
      <section className="stats" aria-label="Summary">
        <Stat label="Listing" value={status ? status.label : "None yet"} note={listing ? listing.name : "Create one to be found"} />
        <Stat label={`Households in ${demand.areaLabel}`} value={demand.visible ? demand.households : "Hidden"} note={demand.visible ? "Using LiFE-OS" : "Shown once five or more join"} />
        <Stat label="Worth a conversation" value={demand.visible ? demand.solarFit : "Hidden"} tone={demand.visible ? "good" : undefined} note="High use, a usable roof, no solar yet" />
      </section>

      <Card title="Requests from households" icon={<MessageSquare size={20} className="card-icon surya" style={{ margin: 0 }} />} className="card-accent-surya">
        <p style={{ marginTop: 0 }}>{waiting ? `${waiting} ${waiting === 1 ? "household is" : "households are"} waiting for your reply.` : threads.length ? "You have replied to everyone." : "Households send quote requests from the vendor map once your listing is approved."}</p>
        <Link className="button button-surya" href="/installer/requests">Open requests <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </Card>

      <div className="split">
        <Card title="See local demand" icon={<TrendingUp size={20} className="card-icon" style={{ margin: 0 }} />}>
          <p style={{ marginTop: 0 }}>How many households around you could use rooftop solar, as area totals only.</p>
          <Link className="button button-outline" href="/installer/demand">Open demand <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </Card>
        <Card title="Be easy to trust" icon={<ShieldCheck size={20} className="card-icon surya" style={{ margin: 0 }} />}>
          <p style={{ marginTop: 0 }}>A checklist for your listing and the official lists citizens will check you against.</p>
          <Link className="button button-outline" href="/installer/trust">Get verified <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </Card>
      </div>
    </>
  );
}
