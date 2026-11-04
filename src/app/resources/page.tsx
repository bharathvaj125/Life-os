import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { SolarCalculator } from "@/components/solar/solar-calculator";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { RESOURCES } from "@/features/solar/resources";
import { listSnapshots } from "@/services/footprint";

export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const user = await getCurrentUser();
  const latest = user ? (await listSnapshots(user.id)).at(-1) : undefined;
  const rate = latest?.billAmountInr && latest.electricityKwh ? Math.round((latest.billAmountInr / latest.electricityKwh) * 100) / 100 : undefined;

  return (
    <>
      <p className="eyebrow">RESOURCE HUB</p>
      <h1>From intent to rooftop</h1>
      <p className="intro">Estimate what rooftop solar could do for your home, then follow the official steps to apply.</p>

      <Card title="Rooftop solar estimate">
        <SolarCalculator defaultMonthlyKwh={latest?.electricityKwh} defaultTariff={rate} signedIn={Boolean(user)} />
      </Card>

      <Card title="What happens next">
        <ol className="steps">
          <li><strong>Check eligibility and subsidy</strong> on the national portal. Rules and amounts can change.</li>
          <li><strong>Register and apply</strong> through your distribution company (DISCOM) for a net-metering connection.</li>
          <li><strong>Choose an empanelled installer</strong> from the portal, and ask for a site survey covering shade and roof strength.</li>
          <li><strong>Inspection and commissioning</strong> by the DISCOM, then claim the subsidy.</li>
        </ol>
      </Card>

      <h2 className="section-title">Official links</h2>
      <div className="grid">
        {RESOURCES.map((r) => (
          <Card key={r.url} title={r.title}>
            <p>{r.description}</p>
            <a className="text-link" href={r.url} target="_blank" rel="noopener noreferrer">{r.provider} <ExternalLink size={14} aria-hidden="true" /></a>
            <p className="muted">Link checked {r.checkedOn}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
