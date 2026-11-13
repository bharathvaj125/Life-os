import type { Metadata } from "next";
import { AdminTools } from "@/components/admin/admin-controls";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { requireViewer } from "@/lib/auth/viewer";
import { num } from "@/lib/format";
import { getAdminSummary } from "@/services/admin";
import { listPendingVendors } from "@/services/vendors";
import { Building2, Eye, EyeOff, Store } from "lucide-react";

export const metadata: Metadata = { title: "Administrator — Regional Aggregates" };

export default async function AdminPage() {
  const viewer = await requireViewer("admin");
  const [s, pendingVendors] = await Promise.all([getAdminSummary(), listPendingVendors()]);
  return (
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
