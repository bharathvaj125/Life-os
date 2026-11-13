import type { Metadata } from "next";
import { AdminLogin, AdminTools } from "@/components/admin/admin-controls";
import { Card } from "@/components/ui/card";
import { adminEnabled, isAdmin } from "@/lib/auth/session";
import { num } from "@/lib/format";
import { VendorReview } from "@/components/admin/vendor-review";
import { getAdminSummary } from "@/services/admin";
import { listPendingVendors } from "@/services/vendors";
import { Building2, EyeOff, Lock, Store } from "lucide-react";

export const metadata: Metadata = { title: "Administrator — Regional Aggregates" };

export default async function AdminPage() {
  if (!adminEnabled()) {
    return (
      <>
        <p className="eyebrow">Administrative Portal</p>
        <h1>Admin Access Not Configured</h1>
        <Card title="Portal Disabled">
          <p>
            Set <code>ADMIN_ACCESS_CODE</code> in your server environment variables to enable this administrative view for state agencies (GEDA / DISCOM).
          </p>
        </Card>
      </>
    );
  }

  if (!(await isAdmin())) {
    return (
      <>
        <p className="eyebrow">GEDA / DISCOM Stakeholders</p>
        <h1>State Administrator Portal</h1>
        <p className="intro">
          Authorized access for Gujarat Energy Development Agency (GEDA) and municipal energy planners. This portal strictly displays k-anonymous regional aggregates.
        </p>
        <div style={{ maxWidth: "480px" }}>
          <Card title="Enter Admin Access Code" icon={<Lock size={18} className="card-icon surya" style={{ margin: 0 }} />}>
            <AdminLogin />
          </Card>
        </div>
      </>
    );
  }

  const [s, pendingVendors] = await Promise.all([getAdminSummary(), listPendingVendors()]);
  return (
    <>
      <p className="eyebrow">State Administrator · Regional Conservation Aggregates</p>
      <h1>Citizen Engagement by Postal Ward</h1>
      <p className="intro">
        Aggregated by 3-digit PIN code prefixes (e.g. 380xxx Ahmedabad, 395xxx Surat). In accordance with digital privacy guidelines, areas with fewer than {s.k} participating households are automatically suppressed to guarantee k-anonymity.
      </p>

      <AdminTools />

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
        <Card title={`Vendor Requests (${pendingVendors.length})`} icon={<Store size={20} className="card-icon" style={{ margin: 0 }} />}>
          <VendorReview vendors={pendingVendors} />
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
