import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, Flame, ListChecks, TrendingDown, TrendingUp, Users, Zap, Leaf } from "lucide-react";
import { NudgeList } from "@/components/actions/nudge-list";
import { ImpactChart } from "@/components/charts/impact-chart";
import { LiveWeather } from "@/components/weather/live-weather";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/field";
import { CountUp } from "@/components/ui/count-up";
import { Ring } from "@/components/ui/ring";
import { SunArc } from "@/components/ui/sun-arc";
import { TermHelp } from "@/components/ui/term-help";
import { TangibleImpact } from "@/components/ui/tangible-impact";
import { EMISSION_FACTORS } from "@/lib/calculations/emission-factors";
import { requireUser } from "@/lib/auth/session";
import { describeEquipment } from "@/features/equipment/catalog";
import { istClock } from "@/lib/calculations/day";
import { formatPeriod, istHour } from "@/lib/dates";
import { num } from "@/lib/format";
import { getActionsView } from "@/services/actions";
import { getFootprintView } from "@/services/footprint";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [{ snapshots, trend }, { nudges, progress, weather, tasks }] = await Promise.all([
    getFootprintView(user.id),
    getActionsView(user),
  ]);
  const { latest, changePct } = trend;
  const perPerson = latest ? Math.round(latest.totalKg / user.householdSize) : null;

  const now = new Date();
  const hour = istHour(now);
  const clock = istClock(now);
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.displayName.split(" ")[0];
  const dailyTasks = tasks.filter((t) => t.cadence === "daily");
  const dailyDone = dailyTasks.filter((t) => t.doneInWindow).length;
  const joinedGoal = progress.completions.some((c) => c.taskId === "join-challenge");
  const owned = user.equipment ? describeEquipment(user.equipment) : [];

  return (
    <>
      <div className="greeting">
        <p className="eyebrow">Overview</p>
        <h1>
          {greeting}, <em>{firstName}</em>
        </h1>
        <p className="intro" style={{ marginBottom: "14px" }}>
          {latest ? `Here is your household's progress for ${formatPeriod(latest.period)}. Everything below is read live from your own data.` : "Record your first month's bill to see your baseline and reduction potential."}
        </p>
        {owned.length ? (
          <div className="badge-row" aria-label="Your equipment">
            {owned.map((o) => (
              <span key={o} className="chip">{o}</span>
            ))}
            <Link className="text-link" href="/profile" style={{ fontSize: "13px", marginLeft: "4px" }}>
              Edit my home →
            </Link>
          </div>
        ) : null}
      </div>

      <section className="sunarc-card" aria-label="Your day">
        <SunArc hour={clock} maxC={weather ? weather.today.maxC : null} />
      </section>

      <section className="path-card" aria-label="Your path today">
        <div className="path-head">
          <div>
            <p className="eyebrow">Your path today</p>
            <h2>{latest && dailyDone > 0 ? "You are on your way" : "Three small steps"}</h2>
          </div>
          <Link className="button button-surya" href="/actions">
            Open today&apos;s actions <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="path-steps">
          <div className="path-step">
            <div className="path-step-top">
              <span className={`path-dot ${latest ? "" : "todo"}`}>{latest ? <Check size={18} aria-hidden="true" /> : <Leaf size={18} aria-hidden="true" />}</span>
              <div>
                <strong>{latest ? "Baseline logged" : "Add your first bill"}</strong>
                <span className="sub">{latest ? `${formatPeriod(latest.period)} · ${num(latest.totalKg)} kg CO₂e` : "One month of units is enough"}</span>
              </div>
            </div>
            <Link className="button button-outline" href="/footprint">{latest ? "Add next month" : "Add a bill"}</Link>
          </div>
          <div className="path-step">
            <div className="path-step-top">
              <span className={`path-dot ${dailyTasks.length && dailyDone === dailyTasks.length ? "" : "todo"}`}>
                {dailyTasks.length && dailyDone === dailyTasks.length ? <Check size={18} aria-hidden="true" /> : <ListChecks size={18} aria-hidden="true" />}
              </span>
              <div>
                <strong>Daily actions</strong>
                <span className="sub">{dailyDone} of {dailyTasks.length} done · {progress.pointsToday} points today</span>
              </div>
            </div>
            <Link className="button button-outline" href="/actions">Choose an action</Link>
          </div>
          <div className="path-step">
            <div className="path-step-top">
              <span className={`path-dot ${joinedGoal ? "" : "todo"}`}>{joinedGoal ? <Check size={18} aria-hidden="true" /> : <Users size={18} aria-hidden="true" />}</span>
              <div>
                <strong>Community goal</strong>
                <span className="sub">{joinedGoal ? "You are part of a local goal" : "Join a goal with your neighbours"}</span>
              </div>
            </div>
            <Link className="button button-outline" href="/community">{joinedGoal ? "See progress" : "Find a goal"}</Link>
          </div>
        </div>
      </section>

      <h2 className="section-title" style={{ margin: "8px 0 4px" }}>Home at a glance</h2>

      <section className="stats" aria-label="Key household metrics">
        <Stat
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {latest ? `Footprint · ${formatPeriod(latest.period)}` : "Footprint"}
              <TermHelp termKey="co2" />
            </span>
          }
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
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              LiFE Level & Points
              <TermHelp termKey="points" />
            </span>
          }
          value={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Zap size={22} style={{ color: "var(--surya-600)" }} />
              <CountUp value={progress.points} /> pts
            </span>
          }
          note={`${progress.level.name}${progress.level.nextAt ? ` · ${progress.level.toNext} pts to next rank` : " · Max Rank Achieved"}`}
        />
        <Stat
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              Action Streak
              <TermHelp termKey="streak" />
            </span>
          }
          value={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Flame size={22} style={{ color: "var(--surya-600)" }} />
              {progress.streak.current} {progress.streak.current === 1 ? "day" : "days"}
            </span>
          }
          note={`Personal best: ${progress.streak.longest} consecutive days`}
        />
        <Stat
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              Avoided Emissions
              <TermHelp termKey="kwh" />
            </span>
          }
          value={<><CountUp value={progress.kgAvoided} decimals={1} /> kg</>}
          note="From your verified completed actions"
          tone="good"
        />
      </section>

      {progress.kgAvoided > 0 ? (
        <div style={{ marginBottom: "24px" }}>
          <TangibleImpact kgAvoided={progress.kgAvoided} />
        </div>
      ) : null}

      <div style={{ marginBottom: "24px" }}>
        <LiveWeather pincode={user.pincode} householdSize={user.householdSize} snapshots={snapshots.slice(-2)} serverWeather={weather} serverNudgeIds={nudges.map((n) => n.id)} />
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
          <div className="quota-row">
            <Ring pct={(progress.pointsToday / progress.dailyLimit) * 100} label="Daily points used">
              <b>{progress.pointsToday}</b>
              <span>of {progress.dailyLimit}</span>
            </Ring>
            <div>
              <p style={{ fontSize: "15px", fontWeight: 650, color: "var(--forest-900)" }}>{progress.pointsToday} of {progress.dailyLimit} points claimed today</p>
              <p className="muted" style={{ fontSize: "13px", marginTop: "4px" }}>{progress.dailyLimit - progress.pointsToday > 0 ? `${progress.dailyLimit - progress.pointsToday} left for today` : "Daily limit reached"}</p>
            </div>
          </div>
          <p className="muted" style={{ fontSize: "13.5px", marginTop: "16px" }}>
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
