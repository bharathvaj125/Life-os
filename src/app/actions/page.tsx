import type { Metadata } from "next";
import { CompleteTaskButton } from "@/components/actions/complete-task-button";
import { NudgeList } from "@/components/actions/nudge-list";
import { Card } from "@/components/ui/card";
import { ProgressBar, Stat } from "@/components/ui/field";
import { requireUser } from "@/lib/auth/session";
import { num } from "@/lib/format";
import { getActionsView } from "@/services/actions";

export const metadata: Metadata = { title: "Actions" };

const CADENCE = { daily: "Daily", weekly: "Weekly", once: "One-time" } as const;

export default async function ActionsPage() {
  const user = await requireUser();
  const { nudges, tasks, progress } = await getActionsView(user);

  return (
    <>
      <p className="eyebrow">NUDGES AND MICRO-TASKS</p>
      <h1>Small actions, counted</h1>
      <p className="intro">Suggestions come from your own bills and the time of day. Tick off the tasks you really did to earn points.</p>

      <section className="stats" aria-label="Progress">
        <Stat label="Points" value={progress.points} note={`${progress.level.name}`} />
        <Stat label="Streak" value={`${progress.streak.current} day${progress.streak.current === 1 ? "" : "s"}`} note={`Longest ${progress.streak.longest}`} />
        <Stat label="CO₂e avoided" value={`${num(progress.kgAvoided)} kg`} tone="good" />
        <Stat label="Today" value={`${progress.pointsToday}/${progress.dailyLimit}`} note="Daily points limit" />
      </section>
      <ProgressBar pct={Math.round((progress.pointsToday / progress.dailyLimit) * 100)} label="Daily points used" />

      <h2 className="section-title">Suggestions for you</h2>
      <Card title="Based on your usage"><NudgeList nudges={nudges} /></Card>

      <h2 className="section-title">Tasks</h2>
      <p className="muted">Tasks are self-reported. Points are awarded once per task window and capped each day, so the leaderboard stays fair.</p>
      <div className="grid tasks">
        {tasks.map((t) => (
          <Card key={t.id} title={t.title}>
            <p className="badge-row"><span className="chip">{CADENCE[t.cadence]}</span><span className="chip">+{t.points} pts</span></p>
            <p>{t.description}</p>
            <p className="muted">Saving estimate: {t.assumption}</p>
            <CompleteTaskButton taskId={t.id} done={t.doneInWindow} points={t.points} />
          </Card>
        ))}
      </div>
    </>
  );
}
