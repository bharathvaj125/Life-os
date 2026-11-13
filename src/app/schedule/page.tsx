import type { Metadata } from "next";
import { Scheduler } from "@/components/schedule/scheduler";
import { Card } from "@/components/ui/card";
import { TermHelp } from "@/components/ui/term-help";
import { AlertTriangle, CheckCircle2, Clock, Sun, Zap } from "lucide-react";

export const metadata: Metadata = { title: "Cleanest Hour — Appliance Scheduler" };

export default function SchedulePage() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p className="eyebrow">Behavioural Scheduling · Cleanest Hour</p>
          <h1>When You Run It Matters as Much as Units</h1>
          <p className="intro" style={{ marginBottom: "16px" }}>
            The electricity grid&apos;s carbon intensity varies dramatically throughout the 24-hour cycle. Running high-wattage equipment during midday solar abundance is up to 40% cleaner than running during the 6–10 PM coal-fired evening peak.
          </p>
        </div>
      </div>

      <Card
        title="Interactive Appliance Load Shifter"
        className="card-accent-surya"
        icon={<Clock size={20} className="card-icon surya" style={{ margin: 0 }} />}
      >
        <Scheduler />
      </Card>

      <div style={{ margin: "36px 0 16px" }}>
        <h2 className="section-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <span>Understanding India&apos;s Grid Timeline</span>
          <TermHelp termKey="tod" />
        </h2>
        <p className="muted" style={{ margin: "4px 0 18px" }}>
          Why time-of-day shifting achieves immediate decarbonization with zero lifestyle compromise.
        </p>
      </div>

      <div className="split">
        {/* Solar window card */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid var(--forest-100)",
            borderTop: "5px solid var(--forest-600)",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 4px 16px -2px rgba(11, 37, 25, 0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sun size={20} style={{ color: "var(--surya-600)" }} />
              <h3 style={{ margin: 0, fontSize: "18px", color: "var(--forest-900)" }}>
                ☀️ The Solar Surge (10 AM–3 PM)
              </h3>
            </div>
            <span className="chip" style={{ background: "var(--forest-50)", color: "var(--forest-800)", fontWeight: 700 }}>
              🌿 Cleanest Window
            </span>
          </div>

          <p style={{ fontSize: "14px", color: "var(--muted-text)", lineHeight: "1.55", margin: "0 0 16px" }}>
            Over <strong>85 GW of solar capacity</strong> feeds the national and Gujarat state grids at midday. The grid has excess green kilowatt-hours that must be consumed immediately.
          </p>

          <div style={{ display: "grid", gap: "8px", fontSize: "13px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", background: "var(--forest-50)", padding: "8px 12px", borderRadius: "8px" }}>
              <CheckCircle2 size={16} style={{ color: "var(--forest-600)", marginTop: "2px", flexShrink: 0 }} />
              <span><strong>40% cleaner energy:</strong> Marginal grid intensity drops to its daily low.</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", background: "var(--forest-50)", padding: "8px 12px", borderRadius: "8px" }}>
              <CheckCircle2 size={16} style={{ color: "var(--forest-600)", marginTop: "2px", flexShrink: 0 }} />
              <span><strong>Ideal appliances:</strong> Washing machines, geysers, water pumps, EV charging.</span>
            </div>
          </div>
        </div>

        {/* Evening peak card */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid var(--surya-100)",
            borderTop: "5px solid var(--terra-600)",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 4px 16px -2px rgba(11, 37, 25, 0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Zap size={20} style={{ color: "var(--terra-600)" }} />
              <h3 style={{ margin: 0, fontSize: "18px", color: "var(--forest-900)" }}>
                🔥 The Thermal Peak (6 PM–10 PM)
              </h3>
            </div>
            <span className="chip warn" style={{ fontWeight: 700 }}>
              ⚠️ Highest Carbon
            </span>
          </div>

          <p style={{ fontSize: "14px", color: "var(--muted-text)", lineHeight: "1.55", margin: "0 0 16px" }}>
            As citizens return home, residential lighting, ACs, and cooking peak together right as solar output drops to zero. Utilities fire up thermal peaker plants.
          </p>

          <div style={{ display: "grid", gap: "8px", fontSize: "13px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", background: "var(--surya-50)", padding: "8px 12px", borderRadius: "8px" }}>
              <AlertTriangle size={16} style={{ color: "var(--terra-600)", marginTop: "2px", flexShrink: 0 }} />
              <span><strong>Dirtiest generation:</strong> Higher CO₂ per unit due to coal/diesel peakers.</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", background: "var(--surya-50)", padding: "8px 12px", borderRadius: "8px" }}>
              <AlertTriangle size={16} style={{ color: "var(--terra-600)", marginTop: "2px", flexShrink: 0 }} />
              <span><strong>Simple habit:</strong> Delay heavy laundry or iron cycles until after 10 PM.</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
