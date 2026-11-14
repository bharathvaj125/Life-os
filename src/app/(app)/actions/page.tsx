import type { Metadata } from "next";
import { CompleteTaskButton } from "@/components/actions/complete-task-button";
import { NudgeList } from "@/components/actions/nudge-list";
import { ProofUpload } from "@/components/actions/proof-upload";
import { LiveWeatherNudges } from "@/components/weather/live-weather";
import { Card } from "@/components/ui/card";
import { GameDeck } from "@/components/gamification/game-deck";
import { Stat } from "@/components/ui/field";
import { BILL_SAVINGS_TASK_ID } from "@/lib/calculations/bill-savings";
import { weekStrip } from "@/lib/calculations/gamification";
import { istDate } from "@/lib/dates";
import { formatHour } from "@/features/gamification/tasks";
import { requireUser } from "@/lib/auth/session";
import { num } from "@/lib/format";
import { getActionsView, type TaskView } from "@/services/actions";
import { Shield, Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Behavioural Nudges & Micro-Tasks" };

const CADENCE = {
  daily: "Daily Micro-Habit",
  weekly: "Weekly Habit",
  once: "One-Time Action",
} as const;

/** Ordinary tasks are ticked; tasks that need a photo are sent for an administrator to check. */
function TaskControl({ task: t }: { task: TaskView }) {
  return t.proof ? <ProofUpload taskId={t.id} points={t.points} status={t.proofStatus} done={t.doneInWindow} /> : <CompleteTaskButton taskId={t.id} done={t.doneInWindow} points={t.points} blockedReason={t.blockedReason} />;
}

export default async function ActionsPage() {
  const user = await requireUser();
  const { nudges, tasks, progress, weather, snapshots } = await getActionsView(user);

  const dailyTasks = tasks.filter((t) => t.cadence === "daily");
  const weeklyTasks = tasks.filter((t) => t.cadence === "weekly");
  const onceTasks = tasks.filter((t) => t.cadence === "once");
  // What can be claimed right now, biggest first. Photo tasks are included: they are the points that count most.
  const quests = tasks
    .filter((t) => !t.doneInWindow && !t.blockedReason && t.proofStatus !== "pending")
    .map((t) => ({ id: t.id, title: t.title, points: t.points, cadence: t.cadence }))
    .sort((a, b) => b.points - a.points);

  return (
    <>
      <p className="eyebrow">Nudges & micro-tasks</p>
      <h1>Actionable Everyday Habits</h1>
      <p className="intro">
        Nudges are automatically triggered by your household consumption patterns and the active time of day. Log each completed action to claim points towards community goals.
      </p>

      <GameDeck
        points={progress.points}
        level={progress.level}
        streak={progress.streak}
        week={weekStrip(progress.completions.filter((c) => c.taskId !== BILL_SAVINGS_TASK_ID).map((c) => c.completedOn), istDate())}
        pointsToday={progress.pointsToday}
        dailyGoal={progress.dailyGoal}
        quests={quests}
      />

      <section className="stats" aria-label="Impact">
        <Stat label="CO₂e Avoided" value={`${num(progress.kgAvoided)} kg`} tone="good" note="Lifetime reduction from your actions" />
      </section>

      <Card
        title="Dynamic Contextual Suggestions"
        className="card-accent-surya"
        icon={<Sparkles size={20} className="card-icon surya" style={{ margin: 0 }} />}
      >
        <p style={{ margin: "0 0 16px" }}>
          These recommendations adapt to your reported bill size, family members, and current peak grid hours.
        </p>
        <NudgeList nudges={nudges} />
        <LiveWeatherNudges pincode={user.pincode} householdSize={user.householdSize} snapshots={snapshots.slice(-2)} serverWeather={weather} serverNudgeIds={nudges.map((n) => n.id)} />
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "10px", margin: "40px 0 16px" }}>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>
            Action Catalog
          </h2>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Ticked actions are self-reported, so each can be rewarded only once per day, week or lifetime. Savings that show up on your bills earn a bigger bonus on the Footprint page.
          </p>
        </div>
        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", fontSize: "12.5px", color: "var(--muted-text)" }}>
          <Shield size={14} /> Server-controlled ledger
        </div>
      </div>

      <div style={{ marginBottom: "28px" }}>
        <h3 style={{ fontSize: "19px", color: "var(--forest-900)", marginBottom: "14px" }}>
          ⚡ Daily Micro-Tasks
        </h3>
        <div className="grid">
          {dailyTasks.map((t) => (
            <Card key={t.id} id={`task-${t.id}`} title={t.title}>
              <div className="badge-row">
                <span className="chip">{CADENCE[t.cadence]}</span>
                <span className="chip surya">+{t.points} pts</span>
                {t.window ? <span className="chip">{formatHour(t.window.fromHour)} to {formatHour(t.window.toHour)}</span> : null}
                {t.proof ? <span className="chip">Photo proof</span> : null}
              </div>
              <p style={{ minHeight: "44px" }}>{t.description}</p>
              <p className="muted" style={{ fontSize: "12.5px", marginTop: "8px" }}>
                <strong>Impact Model:</strong> {t.assumption}
              </p>
              <TaskControl task={t} />
            </Card>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "28px" }}>
        <h3 style={{ fontSize: "19px", color: "var(--forest-900)", marginBottom: "14px" }}>
          📅 Weekly Habits & Upgrades
        </h3>
        <div className="grid">
          {weeklyTasks.concat(onceTasks).map((t) => (
            <Card key={t.id} id={`task-${t.id}`} title={t.title}>
              <div className="badge-row">
                <span className="chip">{CADENCE[t.cadence]}</span>
                <span className="chip surya">+{t.points} pts</span>
                {t.window ? <span className="chip">{formatHour(t.window.fromHour)} to {formatHour(t.window.toHour)}</span> : null}
                {t.proof ? <span className="chip">Photo proof</span> : null}
              </div>
              <p style={{ minHeight: "44px" }}>{t.description}</p>
              <p className="muted" style={{ fontSize: "12.5px", marginTop: "8px" }}>
                <strong>Impact Model:</strong> {t.assumption}
              </p>
              <TaskControl task={t} />
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
