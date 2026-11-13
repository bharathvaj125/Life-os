import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Flame, Sparkles, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { NudgeList } from "@/components/actions/nudge-list";
import { ImpactChart } from "@/components/charts/impact-chart";
import { AccountCard } from "@/components/account/account-card";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { LiveWeather } from "@/components/weather/live-weather";
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
  const [{ snapshots, trend }, { nudges, progress, weather }] = await Promise.all([
    getFootprintView(user.id),
    getActionsView(user),
  ]);
  const { latest, changePct } = trend;
  const perPerson = latest ? Math.round(latest.totalKg / user.householdSize) : null;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p className="eyebrow">Citizen Impact Overview</p>
          <h1>Welcome, {user.displayName}</h1>
          <p className="intro" style={{ marginBottom: "16px" }}>
            {latest
              ? `Here is your household's sustainability progress for ${formatPeriod(latest.period)}.`
              : "Record your first month's bill to see your baseline and reduction potential."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span className="badge" style={{ background: "var(--surya-50)", borderColor: "var(--surya-100)", color: "var(--surya-700)" }}>
            <Sparkles size={14} /> PIN {user.pincode}
          </span>
          <SignOutButton />
        </div>
      </div>

      <section className="stats" aria-label="Key household metrics">
        <Stat
          label={latest ? `Footprint · ${formatPeriod(latest.period)}` : "Footprint"}
          value={latest ? `${num(latest.totalKg)} kg` : "—"}
          note={perPerson ? `${perPerson} kg per family member` : "Pending first entry"}
        />
        <Stat
          label="Change vs last month"
          value={
            changePct === undefined ? (
              "—"
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                {changePct <= 0 ? <TrendingDown size={22} style={{ color: "var(--forest-600)" }} /> : <TrendingUp size={22} style={{ color: "var(--surya-600)" }} />}
                {changePct > 0 ? "+" : ""}{changePct}%
              </span>
            )
          }
          tone={changePct === undefined ? undefined : changePct <= 0 ? "good" : "warn"}
          note={
            changePct === undefined
              ? "Add a second month to measure trend"
              : changePct <= 0
              ? "Heading in the right direction!"
              : "Increased from previous month"
          }
        />
        <Stat
          label="LiFE Level & Points"
          value={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Zap size={22} style={{ color: "var(--surya-600)" }} />
              {progress.points} pts
            </span>
          }
          note={`${progress.level.name}${progress.level.nextAt ? ` · ${progress.level.toNext} pts to next rank` : " · Max Rank Achieved"}`}
        />
        <Stat
          label="Action Streak"
          value={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Flame size={22} style={{ color: "var(--surya-600)" }} />
              {progress.streak.current} {progress.streak.current === 1 ? "day" : "days"}
            </span>
          }
          note={`Personal best: ${progress.streak.longest} consecutive days`}
        />
        <Stat
          label="Avoided Emissions"
          value={`${num(progress.kgAvoided)} kg`}
          note="From your verified completed actions"
          tone="good"
        />
      </section>

      <div style={{ marginBottom: "24px" }}>
        <LiveWeather pincode={user.pincode} householdSize={user.householdSize} snapshots={snapshots.slice(-2)} serverWeather={weather} serverNudgeIds={nudges.map((n) => n.id)} />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <AccountCard email={user.email} />
      </div>

      <div className="split">
        <Card title="Monthly Footprint Trend" className="card-accent-green">
          <div style={{ marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--muted-text)" }}>
              Measured in kg CO₂e (Electricity, Travel & LPG)
            </span>
            <Link className="text-link" href="/footprint" style={{ fontSize: "13px" }}>
              Detailed breakdown →
            </Link>
          </div>
          <ImpactChart data={snapshots.map((s) => ({ label: formatPeriod(s.period), kgCO2e: s.totalKg }))} />
          <p className="muted" style={{ marginTop: "14px", fontSize: "12.5px" }}>
            Grid factor: <strong>{EMISSION_FACTORS.electricityKgPerKwh} kg CO₂/kWh</strong> ({EMISSION_FACTORS.version}), the CEA national grid average.
          </p>
        </Card>

        <Card title="Today's Action Quota" className="card-accent-surya">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "15px", fontWeight: 650, color: "var(--forest-900)" }}>
              {progress.pointsToday} of {progress.dailyLimit} points claimed today
            </span>
            <span className="chip surya">
              {Math.round((progress.pointsToday / progress.dailyLimit) * 100)}% filled
            </span>
          </div>
          <ProgressBar
            pct={Math.round((progress.pointsToday / progress.dailyLimit) * 100)}
            label="Daily points used"
          />
          <p className="muted" style={{ fontSize: "13.5px" }}>
            Points prevent spam: each micro-action is limited by its cadence (daily, weekly, or one-time) and capped to {progress.dailyLimit} points per day to keep leaderboards fair.
          </p>
          <div style={{ marginTop: "20px" }}>
            <Link className="button button-surya" href="/actions" style={{ width: "100%" }}>
              Complete Today&apos;s Actions <ArrowUpRight size={17} />
            </Link>
          </div>
        </Card>
      </div>

      <Card title="Tailored Nudges for Your Home">
        <div style={{ marginBottom: "16px" }}>
          <p style={{ color: "var(--muted-text)", margin: 0 }}>
            Dynamic recommendations prioritized based on your consumption level, household size, and current time of day.
          </p>
        </div>
        <NudgeList nudges={nudges.slice(0, 3)} />
        <div style={{ marginTop: "16px", borderTop: "1px solid var(--sand-200)", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "var(--muted-light)" }}>
            Showing top {Math.min(3, nudges.length)} of {nudges.length} suggestions
          </span>
          <Link className="text-link" href="/actions">
            View all suggestions & tasks →
          </Link>
        </div>
      </Card>
    </>
  );
}
