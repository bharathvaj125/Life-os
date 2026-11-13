import type { Metadata } from "next";
import { AdminTools } from "@/components/admin/admin-controls";
import Link from "next/link";
import { LeafletMap, type MapMarker } from "@/components/maps/leaflet-map";
import { Card } from "@/components/ui/card";
import { areaCentre } from "@/lib/maps/locate";
import { requireViewer } from "@/lib/auth/viewer";
import { num } from "@/lib/format";
import { getAdminSummary } from "@/services/admin";
import { listPendingVendors } from "@/services/vendors";
import { Building2, Eye, EyeOff, MapPin, Store } from "lucide-react";

export const metadata: Metadata = { title: "Administrator — Regional Aggregates" };

export default async function AdminPage() {
  const viewer = await requireViewer("admin");
  const [s, pendingVendors] = await Promise.all([getAdminSummary(), listPendingVendors()]);
  // Same rule as the table: an area with fewer than k households gets a grey marker with no numbers.
  const areaMarkers: MapMarker[] = s.rows.flatMap((r): MapMarker[] => {
    const position = areaCentre(r.prefix);
    if (!position) return [];
    if (r.suppressed) return [{ id: r.prefix, position, kind: "bubble" as const, tone: "grey" as const, radius: 9, title: r.label, lines: [`Fewer than ${s.k} households, so no numbers are shown`] }];
    return [{ id: r.prefix, position, kind: "bubble" as const, tone: "green" as const, radius: Math.min(34, 10 + (r.households ?? 0) * 2), title: r.label, lines: [`${r.households} households`, `Average ${r.avgKwh} kWh a month`, `${r.totalKg} kg CO₂e in total`, `${r.actions} actions logged`] }];
  });  return (
    <>
      <p className="eyebrow">State Administrator · Regional Conservation Aggregates</p>
      <h1>Citizen Engagement by Postal Ward</h1>
      <p className="intro">
        Aggregated by 3-digit PIN code prefixes (e.g. 380xxx Ahmedabad, 395xxx Surat). In accordance with digital privacy guidelines, areas with fewer than {s.k} participating households are automatically suppressed to guarantee k-anonymity.
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
        <div className="stat">
          <span className="stat-label">Total Households</span>
          <strong className="stat-value">{s.totalHouseholds}</strong>
          <span className="stat-note">{s.demoHouseholds} are seeded demo baselines</span>
        </div>
        <div className="stat">
          <span className="stat-label">Active Ward Areas</span>
          <strong className="stat-value">{s.rows.length - s.suppressedGroups}</strong>
          <span className="stat-note">{s.suppressedGroups} suppressed (k &lt; {s.k} threshold)</span>
        </div>
      </section>

      <div style={{ marginBottom: "24px" }}>
        <Card title="Vendor listing requests" icon={<Store size={20} className="card-icon" style={{ margin: 0 }} />}>
          <p style={{ margin: "0 0 12px" }}>
            {pendingVendors.length === 0 ? "No requests are waiting for review." : `${pendingVendors.length} ${pendingVendors.length === 1 ? "listing is" : "listings are"} waiting for review.`}
          </p>
          <Link className="button button-outline" href="/admin/vendors">Open the review queue</Link>
        </Card>
      </div>

      {areaMarkers.length ? (
        <Card title="Area map" icon={<MapPin size={20} className="card-icon" style={{ margin: 0 }} />}>
          <LeafletMap markers={areaMarkers} height={380} label="Map of participating areas" />
          <p className="muted" style={{ margin: "10px 0 0", fontSize: "12.5px" }}>Circles sit at the centre of each area and grow with the number of households. Grey circles are areas below the privacy threshold.</p>
        </Card>
      ) : null}

      <Card title="Postal Ward Aggregation (k-Anonymity Protected)" icon={<Building2 size={20} className="card-icon" style={{ margin: 0 }} />}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Postal Ward Area</th>
                <th>Households</th>
                <th>Avg kWh / Household</th>
                <th>Total Avoided CO₂e</th>
                <th>Actions Logged</th>
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r) => (
                <tr key={r.prefix}>
                  <td>
                    <strong>{r.label}</strong>
                  </td>
                  {r.suppressed ? (
                    <td colSpan={4} className="muted">
                      <span className="chip" style={{ background: "var(--sand-100)", color: "var(--muted-light)" }}>
                        <EyeOff size={11} /> Suppressed: fewer than {s.k} households (k-anonymity protection)
                      </span>
                    </td>
                  ) : (
                    <>
                      <td>{r.households}</td>
                      <td>{num(r.avgKwh ?? 0)} kWh</td>
                      <td>
                        <strong>{num(r.totalKg ?? 0)} kg</strong>
                      </td>
                      <td>{r.actions}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: "14px", fontSize: "12.5px" }}>
          * Calculated from the most recent billing snapshot of each registered citizen. Privacy preservation: individual household addresses, identities, and private usage are never exposed to administrative queries.
        </p>
      </Card>
    </>
  );
}
