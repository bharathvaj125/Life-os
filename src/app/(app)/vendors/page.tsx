import type { Metadata } from "next";
import { BadgeCheck, ExternalLink, MapPin, Phone, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeafletMap, type MapMarker } from "@/components/maps/leaflet-map";
import { Card } from "@/components/ui/card";
import { OFFICIAL_VENDOR_CHECKS, VENDOR_SERVICES, VENDOR_SERVICE_IDS, VERIFY_STEPS, serviceLabel } from "@/features/vendors/catalog";
import { requireUser } from "@/lib/auth/session";
import { locateByPincode } from "@/lib/maps/locate";
import { listApprovedVendors } from "@/services/vendors";
import type { VendorService } from "@/types";

export const metadata: Metadata = { title: "Sustainable Energy Vendor Directory" };

export default async function VendorsPage({ searchParams }: { searchParams: Promise<{ service?: string; place?: string }> }) {
  const user = await requireUser();
  const { service: rawService, place } = await searchParams;
  const service = VENDOR_SERVICE_IDS.includes(rawService as VendorService) ? (rawService as VendorService) : undefined;
  const vendors = await listApprovedVendors({ service, place });
  const filtered = Boolean(service || place?.trim());
  const markers: MapMarker[] = vendors.flatMap((v) => {
    const position = locateByPincode(v.pincode, v.id);
    if (!position) return [];
    return [{ id: v.id, position, kind: "pin" as const, tone: v.isSample ? ("grey" as const) : ("amber" as const), title: v.name, lines: [`${v.city} · ${v.pincode}`, v.services.map(serviceLabel).join(", "), ...(v.isSample ? ["Sample listing"] : [])], link: v.website && !v.isSample ? { href: v.website, text: "Website" } : undefined }];
  });
  const here = locateByPincode(user.pincode, "you");
  if (here) markers.push({ id: "you", position: here, kind: "bubble", tone: "you", radius: 9, title: "Your area", lines: [`PIN ${user.pincode}`] });

  return (
    <>
      <p className="eyebrow">Requirement 4 · Actionable Resource Hub</p>
      <h1>Find a Sustainable Energy Vendor</h1>
      <p className="intro">
        Installers and suppliers for rooftop solar, solar water heaters, EV charging, energy audits and efficient appliances. Installers list themselves and an administrator reviews each listing before it appears here.
      </p>

      <Card title="Verify before you pay" icon={<ShieldAlert size={20} className="card-icon surya" style={{ margin: 0 }} />} className="card-accent-surya">
        <p style={{ marginTop: 0 }}>
          A listing here is a starting point, not an endorsement. For rooftop solar and the central subsidy, only vendors on the official lists qualify.
        </p>
        <ol className="notes">
          {VERIFY_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" }}>
          {OFFICIAL_VENDOR_CHECKS.map((c) => (
            <a key={c.url} className="chip" href={c.url} target="_blank" rel="noopener noreferrer" title={c.note}>
              {c.title} <ExternalLink size={12} aria-hidden="true" />
            </a>
          ))}
        </div>
      </Card>

      <form method="get" style={{ margin: "28px 0 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "end" }} aria-label="Filter vendors">
        <div className="field">
          <label htmlFor="service">Service</label>
          <select id="service" name="service" defaultValue={service ?? ""}>
            <option value="">All services</option>
            {VENDOR_SERVICES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="place">City or PIN code</label>
          <input id="place" name="place" defaultValue={place ?? ""} placeholder="e.g. Ahmedabad or 380" maxLength={40} />
        </div>
        <Button type="submit"><Search size={16} aria-hidden="true" /> Search</Button>
        {filtered ? <a className="text-link" href="/vendors">Clear filters</a> : null}
      </form>

      <p className="muted" style={{ margin: "0 0 14px" }} aria-live="polite">
        {vendors.length} {vendors.length === 1 ? "listing" : "listings"}{filtered ? " match your search" : ""}
      </p>

      {markers.length > 1 ? (
        <div style={{ margin: "0 0 20px" }}>
          <LeafletMap markers={markers} height={340} label="Map of vendor listings" />
          <p className="muted" style={{ margin: "8px 0 0", fontSize: "12.5px" }}>Pins are placed around each business&apos;s city, not at a street address. Grey pins are sample listings.</p>
        </div>
      ) : null}

      {vendors.length === 0 ? (
        <Card title="No listings match yet">
          <p style={{ margin: 0 }}>Try a wider search or another city.</p>
        </Card>
      ) : (
        <div className="grid">
          {vendors.map((v) => (
            <Card key={v.id} title={v.name} badge={v.isSample ? <span className="chip warn">Sample listing</span> : <span className="chip"><BadgeCheck size={12} aria-hidden="true" /> Reviewed</span>}>
              <p style={{ margin: "0 0 10px", display: "flex", gap: "6px", alignItems: "center" }}>
                <MapPin size={15} aria-hidden="true" /> {v.city} · {v.pincode}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                {v.services.map((s) => (
                  <span key={s} className="chip">{serviceLabel(s)}</span>
                ))}
              </div>
              {v.empanelmentClaim ? (
                <p className="muted" style={{ fontSize: "13px", margin: "0 0 10px" }}>
                  Says: &ldquo;{v.empanelmentClaim}&rdquo;. Self-declared, so check it on the official list.
                </p>
              ) : null}
              {v.isSample ? (
                <p className="muted" style={{ fontSize: "13px", margin: 0 }}>Placeholder entry for demonstration. It is not a real business.</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
                  {v.phone ? (
                    <a className="text-link" href={`tel:+91${v.phone}`}>
                      <Phone size={13} aria-hidden="true" /> {v.phone}
                    </a>
                  ) : null}
                  {v.website ? (
                    <a className="text-link" href={v.website} target="_blank" rel="noopener noreferrer nofollow">
                      Website <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

    </>
  );
}
