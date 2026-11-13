import type { Metadata } from "next";
import { Trophy, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/field";
import { challengeProgress } from "@/lib/calculations/gamification";
import { requireViewer } from "@/lib/auth/viewer";
import { istDate } from "@/lib/dates";
import { num } from "@/lib/format";
import { getRepository } from "@/lib/store";

export const metadata: Metadata = { title: "Administrator — Challenges" };

export default async function AdminChallengesPage() {
  await requireViewer("admin");
  const repo = getRepository();
  const [challenges, memberships, completions] = await Promise.all([repo.listChallenges(), repo.listMemberships(), repo.listCompletions()]);
  const today = istDate();
  const rows = challenges
    .map((c) => ({ c, p: challengeProgress(c, memberships, completions) }))
    .sort((a, b) => Number(b.c.endsOn >= today) - Number(a.c.endsOn >= today) || a.c.title.localeCompare(b.c.title));
  const active = rows.filter((r) => r.c.endsOn >= today).length;
  const members = new Set(memberships.map((m) => m.userId)).size;

  return (
    <>
      <p className="eyebrow">State Administrator · Challenges</p>
      <h1>Community goals and their progress</h1>
      <p className="intro">Every neighbourhood and Gujarat-wide goal, with how far the members have got. Totals only: no household is named.</p>

      <section className="stats" aria-label="Challenge totals">
        <div className="stat">
          <span className="stat-label">Goals running</span>
          <strong className="stat-value">{active}</strong>
          <span className="stat-note">{rows.length - active} finished</span>
        </div>
        <div className="stat">
          <span className="stat-label">Households taking part</span>
          <strong className="stat-value">{members}</strong>
          <span className="stat-note">In at least one goal</span>
        </div>
      </section>

      <div className="grid">
        {rows.map(({ c, p }) => (
          <Card key={c.id} title={c.title} icon={<Trophy size={20} className="card-icon" style={{ margin: 0 }} />}>
            <div className="badge-row">
              <span className="chip">{c.regionPrefix ? c.region : "Gujarat"}</span>
              <span className="chip"><Users size={12} aria-hidden="true" /> {p.members} {p.members === 1 ? "member" : "members"}</span>
              {c.endsOn < today ? <span className="chip warn">Finished</span> : null}
            </div>
            <p style={{ minHeight: "44px" }}>{c.description}</p>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", fontWeight: 600, marginBottom: "6px" }}>
              <span>Goal progress</span>
              <span>{p.pct}%</span>
            </div>
            <ProgressBar pct={p.pct} label={`${c.title} progress`} />
            <p className="muted" style={{ fontSize: "12.5px", marginTop: "8px" }}>
              {num(p.value)} of {num(c.target)} {c.metric === "actions" ? "actions" : "kg CO₂e"} · {c.startsOn} to {c.endsOn}
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}
