import type { Metadata } from "next";
import { AdminLogin, AdminTools } from "@/components/admin/admin-controls";
import { Card } from "@/components/ui/card";
import { adminEnabled, isAdmin } from "@/lib/auth/session";
import { num } from "@/lib/format";
import { getAdminSummary } from "@/services/admin";

export const metadata: Metadata = { title: "Administrator" };

export default async function AdminPage() {
  if (!adminEnabled()) {
    return (
      <>
        <p className="eyebrow">ADMINISTRATOR</p>
        <h1>Not configured</h1>
        <Card title="Admin access is off"><p>Set <code>ADMIN_ACCESS_CODE</code> in the server environment to enable this view.</p></Card>
      </>
    );
  }

  if (!(await isAdmin())) {
    return (
      <>
        <p className="eyebrow">ADMINISTRATOR</p>
        <h1>Administrator sign-in</h1>
        <p className="intro">For GEDA and DISCOM staff. This view shows area-level totals only.</p>
        <Card title="Access code"><AdminLogin /></Card>
      </>
    );
  }

  const s = await getAdminSummary();
  return (
    <>
      <p className="eyebrow">ADMINISTRATOR · AREA TOTALS</p>
      <h1>Participation by area</h1>
      <p className="intro">Grouped by the first three digits of the PIN code. Areas with fewer than {s.k} households are hidden so no household can be singled out.</p>
      <AdminTools />

      <section className="stats" aria-label="Totals">
        <div className="stat"><span className="stat-label">Households</span><strong className="stat-value">{s.totalHouseholds}</strong><span className="stat-note">{s.demoHouseholds} are demo data</span></div>
        <div className="stat"><span className="stat-label">Areas shown</span><strong className="stat-value">{s.rows.length - s.suppressedGroups}</strong><span className="stat-note">{s.suppressedGroups} hidden (under {s.k})</span></div>
      </section>

      <Card title="Areas">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Area</th><th>Households</th><th>Avg kWh / household</th><th>Total kg CO₂e</th><th>Actions completed</th></tr></thead>
            <tbody>
              {s.rows.map((r) => (
                <tr key={r.prefix}>
                  <td>{r.label}</td>
                  {r.suppressed ? <td colSpan={4} className="muted">Hidden: fewer than {s.k} households</td> : <><td>{r.households}</td><td>{num(r.avgKwh ?? 0)}</td><td>{num(r.totalKg ?? 0)}</td><td>{r.actions}</td></>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted">Uses each household&apos;s most recent month. Demo households are included in these numbers and are not real measurements.</p>
      </Card>
    </>
  );
}
