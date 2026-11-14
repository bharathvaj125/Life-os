import type { Metadata } from "next";
import { DayPlanner } from "@/components/schedule/day-planner";
import { Card } from "@/components/ui/card";
import { TermHelp } from "@/components/ui/term-help";
import { requireUser } from "@/lib/auth/session";
import { listSnapshots } from "@/services/footprint";
import { INTENSITY_INDEX, PEAK_HOURS, appliancesFor } from "@/lib/calculations/schedule";
import { Clock, Sun, Zap } from "lucide-react";

export const metadata: Metadata = { title: "Cleanest Hour — Appliance Scheduler" };

export default async function SchedulePage() {
  const user = await requireUser();
  // Only offered as a shortcut. The planner starts empty and the household chooses what to add.
  const owned = user.equipment ? appliancesFor(user.equipment).map((a) => ({ name: a.name, kw: a.kw, hours: a.hours, daysPerWeek: a.runsPerWeek })) : [];
  const latest = (await listSnapshots(user.id)).at(-1);
  // Taken from the same hourly model the scheduler uses, so the text and the tool can never disagree.
  const mean = (hours: number[]) => hours.reduce((sum, h) => sum + INTENSITY_INDEX[h], 0) / hours.length;
  const cleaner = Math.round((1 - mean([10, 11, 12, 13, 14]) / mean(PEAK_HOURS)) * 100);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p className="eyebrow">Cleanest hour</p>
          <h1>When You Run It Matters as Much as How Much You Use</h1>
          <p className="intro" style={{ marginBottom: "16px" }}>
            The grid&apos;s carbon intensity changes through the day. In our illustrative hourly model, power at midday is about {cleaner}% lower in carbon than at the 6–10 PM evening peak.
          </p>
        </div>
      </div>

      <Card
        title="Your day, hour by hour"
        className="card-accent-surya"
        icon={<Clock size={20} className="card-icon surya" style={{ margin: 0 }} />}
      >
        <DayPlanner fromProfile={owned} defaultUnits={latest?.electricityKwh} />
      </Card>

      <div style={{ margin: "36px 0 16px" }}>
        <h2 className="section-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <span>Why these hours</span>
          <TermHelp termKey="tod" />
        </h2>
        <p className="muted" style={{ margin: "4px 0 18px" }}>
          The same appliance, the same units, a different carbon footprint depending on the hour.
        </p>
      </div>

      <div className="why-grid">
        <article className="why why-solar">
          <Sun size={22} aria-hidden="true" />
          <h3>Solar surge · 10 AM to 3 PM</h3>
          <p>Rooftop and utility solar feed the grid, so each unit carries about {cleaner}% less carbon than in the evening peak, in our illustrative model.</p>
          <p className="why-do">Run the washing machine, pump, geyser timer and EV charger here.</p>
        </article>
        <article className="why why-peak">
          <Zap size={22} aria-hidden="true" />
          <h3>Evening peak · 6 PM to 10 PM</h3>
          <p>Lights, cooking and air conditioners switch on just as the sun goes, and the grid leans on fossil peaking plants.</p>
          <p className="why-do">Hold the iron and laundry until after 10 PM.</p>
        </article>
        <article className="why why-night">
          <Clock size={22} aria-hidden="true" />
          <h3>Night and early morning</h3>
          <p>Demand is low and the grid sits close to its daily average. A fine time for slow jobs like charging a scooter.</p>
          <p className="why-do">Use a timer so the charger starts after 10 PM.</p>
        </article>
      </div>
    </>
  );
}
