import type { Metadata } from "next";
import Link from "next/link";
import { NudgeList } from "@/components/actions/nudge-list";
import { ImpactChart } from "@/components/charts/impact-chart";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { Card } from "@/components/ui/card";
import { ProgressBar, Stat } from "@/components/ui/field";
import { EMISSION_FACTORS } from "@/lib/calculations/emission-factors";
import { requireUser } from "@/lib/auth/session";
import { formatPeriod } from "@/lib/dates";
import { num } from "@/lib/format";
import { getActionsView } from "@/services/actions";
import { getFootprintView } from "@/services/footprint";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [{ snapshots, trend }, { nudges, progress }] = await Promise.all([getFootprintView(user.id), getActionsView(user)]);
  const { latest, changePct } = trend;
  const perPerson = latest ? Math.round(latest.totalKg / user.householdSize) : null;

  return (
    <>
      <p className="eyebrow">YOUR DASHBOARD</p>
      <h1>Hello, {user.displayName}</h1>
      <p className="intro">
        {latest ? `Here is where ${formatPeriod(latest.period)} landed and what to do next.` : "Add your first month to see your footprint."} <SignOutButton />
      </p>

      <section className="stats" aria-label="Your numbers">
        <Stat label={latest ? `Footprint · ${formatPeriod(latest.period)}` : "Footprint"} value={latest ? `${num(latest.totalKg)} kg CO₂e` : "—"} note={perPerson ? `${perPerson} kg per person` : undefined} />
        <Stat
          label="Change vs last month"
          value={changePct === undefined ? "—" : `${changePct > 0 ? "+" : ""}${changePct}%`}
          tone={changePct === undefined ? undefined : changePct <= 0 ? "good" : "warn"}
          note={changePct === undefined ? "Add a second month" : changePct <= 0 ? "Heading the right way" : "Higher than last month"}
        />
        <Stat label="Points" value={progress.points} note={`${progress.level.name}${progress.level.nextAt ? ` · ${progress.level.toNext} to next level` : ""}`} />
        <Stat label="Streak" value={`${progress.streak.current} day${progress.streak.current === 1 ? "" : "s"}`} note={`Longest ${progress.streak.longest}`} />
        <Stat label="Estimated CO₂e avoided" value={`${num(progress.kgAvoided)} kg`} note="From actions you completed" tone="good" />
      </section>

      <div className="split">
        <Card title="Footprint over time">
          <ImpactChart data={snapshots.map((s) => ({ label: formatPeriod(s.period), kgCO2e: s.totalKg }))} />
          <p className="muted">Estimated with a grid factor of {EMISSION_FACTORS.electricityKgPerKwh} kg CO₂ per kWh ({EMISSION_FACTORS.version}). These are estimates, not measurements. <Link className="text-link" href="/footprint">See the working →</Link></p>
        </Card>
        <Card title="Today&apos;s points">
          <p>{progress.pointsToday} of {progress.dailyLimit} daily points</p>
          <ProgressBar pct={Math.round((progress.pointsToday / progress.dailyLimit) * 100)} label="Daily points used" />
          <p className="muted">Each task can be rewarded once per day, week or ever, depending on the task.</p>
          <Link className="button" href="/actions">Do today&apos;s actions</Link>
        </Card>
      </div>

      <Card title="Suggested for you">
        <NudgeList nudges={nudges.slice(0, 3)} />
        <Link className="text-link" href="/actions">All suggestions and tasks →</Link>
      </Card>
    </>
  );
}
