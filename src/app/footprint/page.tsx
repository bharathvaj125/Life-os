import type { Metadata } from "next";
import { ImpactChart } from "@/components/charts/impact-chart";
import { FootprintForm } from "@/components/forms/footprint-form";
import { Card } from "@/components/ui/card";
import { EMISSION_FACTORS } from "@/lib/calculations/emission-factors";
import { requireUser } from "@/lib/auth/session";
import { formatPeriod, istPeriod } from "@/lib/dates";
import { num } from "@/lib/format";
import { getFootprintView } from "@/services/footprint";

export const metadata: Metadata = { title: "Footprint" };

export default async function FootprintPage() {
  const user = await requireUser();
  const { snapshots, trend } = await getFootprintView(user.id);
  const history = [...snapshots].reverse();
  const { baselineKg, latest } = trend;
  const sinceBaseline = baselineKg && latest && snapshots.length > 1 ? Math.round(((latest.totalKg - baselineKg) / baselineKg) * 1000) / 10 : null;

  return (
    <>
      <p className="eyebrow">FOOTPRINT TRACKER</p>
      <h1>Your footprint, month by month</h1>
      <p className="intro">Your first month is your baseline. Add each new bill to see whether your habits are moving the number.</p>

      {sinceBaseline !== null ? <p className="callout">{sinceBaseline <= 0 ? `Down ${Math.abs(sinceBaseline)}% from your baseline of ${num(baselineKg ?? 0)} kg CO₂e.` : `Up ${sinceBaseline}% from your baseline of ${num(baselineKg ?? 0)} kg CO₂e.`}</p> : null}

      <div className="split">
        <Card title="Trend"><ImpactChart data={snapshots.map((s) => ({ label: formatPeriod(s.period), kgCO2e: s.totalKg }))} /></Card>
        <Card title="Add or update a month"><FootprintForm defaultPeriod={istPeriod()} /></Card>
      </div>

      <Card title="History">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Month</th><th>Electricity</th><th>Travel</th><th>LPG</th><th>Total</th></tr></thead>
            <tbody>
              {history.map((s) => (
                <tr key={s.id}>
                  <td>{formatPeriod(s.period)}</td>
                  <td>{num(s.electricityKwh)} kWh · {num(s.electricityKg)} kg</td>
                  <td>{num(s.commuteKg)} kg</td>
                  <td>{num(s.lpgKg)} kg</td>
                  <td><strong>{num(s.totalKg)} kg CO₂e</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="How we calculate this">
        <p>Footprint = electricity units × grid factor + travel km × vehicle factors + LPG cylinders × cylinder factor. Every month stores the factor set it used ({EMISSION_FACTORS.version}), so old numbers stay reproducible.</p>
        <ul className="notes">
          <li>Grid electricity: {EMISSION_FACTORS.electricityKgPerKwh} kg CO₂ per kWh. An indicative India average from the CEA CO₂ Baseline Database; update to the latest release for official reporting.</li>
          <li>Car {EMISSION_FACTORS.carKgPerKm}, two-wheeler {EMISSION_FACTORS.bikeKgPerKm}, public transport {EMISSION_FACTORS.publicKgPerKm} kg CO₂ per km.</li>
          <li>LPG: {EMISSION_FACTORS.lpgKgPerCylinder} kg CO₂ per 14.2 kg cylinder.</li>
          <li>These are estimates for awareness and comparison, not a certified inventory.</li>
        </ul>
      </Card>
    </>
  );
}
