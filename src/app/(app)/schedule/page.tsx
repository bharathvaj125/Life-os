import type { Metadata } from "next";
import { Scheduler } from "@/components/schedule/scheduler";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { appliancesFor } from "@/lib/calculations/schedule";
import { Clock, Info } from "lucide-react";

export const metadata: Metadata = { title: "Cleanest Hour — Appliance Scheduler" };

export default async function SchedulePage() {
  const user = await requireUser();
  const appliances = appliancesFor(user.equipment);
  return (
    <>
      <p className="eyebrow">Behavioural Scheduling · Cleanest Hour</p>
      <h1>Time-of-Day Matters as Much as Units</h1>
      <p className="intro">
        {user.equipment ? "The appliances below are the ones you told us you own. " : ""}The electricity grid&apos;s carbon intensity varies dramatically throughout the day. Running high-wattage equipment during midday solar abundance is up to 40% cleaner than running during the 6–10 PM coal-fired evening peak.
      </p>

      <Card
        title="Interactive Appliance Load Shifter"
        className="card-accent-surya"
        icon={<Clock size={20} className="card-icon surya" style={{ margin: 0 }} />}
      >
        <Scheduler appliances={appliances} />
      </Card>

      <Card title="How Time-of-Day Balancing Works" icon={<Info size={20} className="card-icon" style={{ margin: 0 }} />}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <div>
            <h3 style={{ fontSize: "16px", color: "var(--forest-900)" }}>☀️ The Solar Surge (10 AM–3 PM)</h3>
            <p style={{ fontSize: "14px" }}>
              India has over 85 GW of solar generation feeding the grid at midday. Running heavy appliances like washing machines, dishwashers, and geysers during these hours directly utilizes green kilowatt-hours before they are curtailed.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: "16px", color: "var(--surya-700)" }}>🔥 The Thermal Peak (6 PM–10 PM)</h3>
            <p style={{ fontSize: "14px" }}>
              When citizens return home, lighting, air conditioning, and cooking peak simultaneously while solar generation drops to zero. Utilities fire up marginal thermal and diesel plants with higher emissions per kWh.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}
