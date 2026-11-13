import type { Metadata } from "next";
import { ImpactChart } from "@/components/charts/impact-chart";
import { FootprintForm } from "@/components/forms/footprint-form";
import { Card } from "@/components/ui/card";
import { EMISSION_FACTORS } from "@/lib/calculations/emission-factors";
import { requireUser } from "@/lib/auth/session";
import { formatPeriod, istPeriod } from "@/lib/dates";
import { num } from "@/lib/format";
import { BILL_SAVINGS_TASK_ID } from "@/lib/calculations/bill-savings";
import { plausibilityOf } from "@/lib/calculations/plausibility";
import { getProgress } from "@/services/actions";
import { BillScanner } from "@/components/bills/bill-scanner";
import { scannedPeriods } from "@/services/bills";
import { getFootprintView } from "@/services/footprint";
import { ArrowDownRight, ArrowUpRight, BadgeCheck, BarChart3, BookOpen, Leaf, ScanLine, Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Personalised Footprint Tracker" };

export default async function FootprintPage() {
  const user = await requireUser();
  const [{ snapshots, trend }, { completions }, scanned] = await Promise.all([getFootprintView(user.id), getProgress(user.id), scannedPeriods(user.id)]);
  const bonusByPeriod = new Map(completions.filter((c) => c.taskId === BILL_SAVINGS_TASK_ID).map((c) => [c.dedupeKey.slice(BILL_SAVINGS_TASK_ID.length + 1), c.points]));
  const eq = user.equipment;
  const show = { lpg: eq ? eq.lpg : true, car: eq ? eq.petrolCar : true, bike: eq ? eq.petrolTwoWheeler : true };
  const history = [...snapshots].reverse();
  const { baselineKg, latest } = trend;
  const sinceBaseline =
    baselineKg && latest && snapshots.length > 1
      ? Math.round(((latest.totalKg - baselineKg) / baselineKg) * 1000) / 10
      : null;

  return (
    <>
      <p className="eyebrow">Requirement 1 · Personalised Footprint Tracker</p>
      <h1>Your Carbon Baseline & History</h1>
      <p className="intro">
        Your first month forms your baseline. As you adopt energy-saving habits and log each new bill, see your trajectory in kilograms of CO₂ equivalent. If your units fall by 5% or more against last month, you earn a bill savings bonus.
      </p>

      {sinceBaseline !== null ? (
        <div
          className={`callout ${sinceBaseline <= 0 ? "" : "surya"}`}
          style={{ display: "flex", alignItems: "center", gap: "12px" }}
        >
          {sinceBaseline <= 0 ? (
            <ArrowDownRight size={26} style={{ color: "var(--forest-600)" }} />
          ) : (
            <ArrowUpRight size={26} style={{ color: "var(--surya-600)" }} />
          )}
          <div>
            <strong>
              {sinceBaseline <= 0
                ? `Down ${Math.abs(sinceBaseline)}% compared to your baseline.`
                : `Up ${sinceBaseline}% from your initial baseline.`}
            </strong>
            <div style={{ fontSize: "13px", marginTop: "2px", opacity: 0.9 }}>
              Initial baseline: {num(baselineKg ?? 0)} kg CO₂e · Current: {num(latest?.totalKg ?? 0)} kg CO₂e
            </div>
          </div>
        </div>
      ) : null}

      <Card title="Scan your bill" className="card-accent-surya" icon={<ScanLine size={20} className="card-icon surya" style={{ margin: 0 }} />}>
        <BillScanner />
      </Card>

      <div className="split">
        <Card title="Emissions Trajectory" className="card-accent-green" icon={<BarChart3 size={20} className="card-icon" style={{ margin: 0 }} />}>
          <ImpactChart data={snapshots.map((s) => ({ label: formatPeriod(s.period), kgCO2e: s.totalKg }))} />
          <p className="muted" style={{ marginTop: "14px", fontSize: "12.5px" }}>
            Monthly data stored securely with user isolation. Grid emissions calculated using {EMISSION_FACTORS.electricityKgPerKwh} kg CO₂/kWh ({EMISSION_FACTORS.version}).
          </p>
        </Card>

        <Card title="Add / Update Monthly Entry" className="card-accent-surya" icon={<Sparkles size={20} className="card-icon surya" style={{ margin: 0 }} />}>
          <FootprintForm defaultPeriod={istPeriod()} show={show} />
        </Card>
      </div>

      <Card title="Historical Log" icon={<Leaf size={20} className="card-icon" style={{ margin: 0 }} />}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Billing Month</th>
                <th>Grid Electricity</th>
                <th>Travel & Commute</th>
                <th>Cooking LPG</th>
                <th>Total Footprint</th>
              </tr>
            </thead>
            <tbody>
              {history.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{formatPeriod(s.period)}</strong>
                  </td>
                  <td>
                    {num(s.electricityKwh)} kWh <span className="muted">({num(s.electricityKg)} kg)</span>
                  </td>
                  <td>{num(s.commuteKg)} kg</td>
                  <td>
                    {s.lpgCylinders ? `${s.lpgCylinders} cyl · ` : ""}
                    {num(s.lpgKg)} kg
                  </td>
                  <td>
                    <strong style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--forest-900)" }}>
                      {num(s.totalKg)} kg CO₂e
                    </strong>
                    {scanned.get(s.period) ? (
                      <div>
                        <span className="chip" style={{ marginTop: "6px" }}><BadgeCheck size={12} aria-hidden="true" /> Bill scanned · ••••{scanned.get(s.period)?.last4}</span>
                      </div>
                    ) : (
                      <div>
                        <span className="chip warn" style={{ marginTop: "6px", opacity: 0.85 }}>Self-reported</span>
                      </div>
                    )}
                    {plausibilityOf(s.electricityKwh, user.householdSize).plausible ? null : (
                      <div>
                        <span className="chip warn" style={{ marginTop: "6px" }} title={`Below ${plausibilityOf(s.electricityKwh, user.householdSize).minKwh} kWh for ${user.householdSize} people`}>Unusually low for {user.householdSize} {user.householdSize === 1 ? "person" : "people"}</span>
                      </div>
                    )}
                    {bonusByPeriod.get(s.period) ? (
                      <div>
                        <span className="chip" style={{ marginTop: "6px" }}>+{bonusByPeriod.get(s.period)} pts bill savings bonus</span>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Calculation Methodology & Transparency" icon={<BookOpen size={20} className="card-icon" style={{ margin: 0 }} />}>
        <p>
          Mission LiFE prioritizes verifiable data over arbitrary numbers. Total carbon emissions are calculated by applying published official emissions factors to your activity inputs:
        </p>
        <ul className="notes">
          <li>
            <strong>Grid Electricity:</strong> {EMISSION_FACTORS.electricityKgPerKwh} kg CO₂ per kWh the national grid average from the Central Electricity Authority (CEA) CO₂ Baseline Database, FY 2024-25 ({EMISSION_FACTORS.version}). (1 t CO₂/MWh = 1 kg CO₂/kWh).
          </li>
          <li>
            <strong>Vehicle Travel:</strong> Four-wheeler petrol/diesel at {EMISSION_FACTORS.carKgPerKm} kg CO₂/km; two-wheeler motorcycle/scooter at {EMISSION_FACTORS.bikeKgPerKm} kg CO₂/km; public transport (bus/metro) at {EMISSION_FACTORS.publicKgPerKm} kg CO₂/km.
          </li>
          <li>
            <strong>LPG Cooking Gas:</strong> {EMISSION_FACTORS.lpgKgPerCylinder} kg CO₂ per standard 14.2 kg domestic cylinder.
          </li>
          <li>
            <strong>Reproducibility:</strong> Every recorded snapshot stores the active factor version ({EMISSION_FACTORS.version}) so previous historical calculations remain immutable and reproducible.
          </li>
        </ul>
      </Card>
    </>
  );
}
