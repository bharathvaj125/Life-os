import type { Metadata } from "next";
import { JoinChallengeButton, LeaderboardOptIn } from "@/components/community/community-controls";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/field";
import { requireUser } from "@/lib/auth/session";
import { num } from "@/lib/format";
import { getCommunityView, type LeaderRow } from "@/services/community";

export const metadata: Metadata = { title: "Community" };

function Board({ rows }: { rows: LeaderRow[] }) {
  if (!rows.length) return <p className="muted">Nobody has opted in yet. Be the first.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Name</th><th>Area</th><th>Level</th><th>Points</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.rank}-${r.displayName}`} className={r.isYou ? "you" : undefined}>
              <td>{r.rank}</td>
              <td>{r.displayName}{r.isYou ? " (you)" : ""}</td>
              <td>{r.region}</td>
              <td>{r.level}</td>
              <td>{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function CommunityPage() {
  const user = await requireUser();
  const view = await getCommunityView(user);

  return (
    <>
      <p className="eyebrow">COMMUNITY IMPACT</p>
      <h1>Better together</h1>
      <p className="intro">Join a goal for your area and watch everyone&apos;s actions add up.</p>

      <div className="grid challenges">
        {view.challenges.map((c) => (
          <Card key={c.id} title={c.title}>
            <p className="badge-row"><span className="chip">{c.region}</span><span className="chip">{c.progress.members} members</span></p>
            <p>{c.description}</p>
            <ProgressBar pct={c.progress.pct} label={`${c.title} progress`} />
            <p className="muted">{num(c.progress.value)} of {num(c.progress.target)} {c.metric === "actions" ? "actions" : "kg CO₂e avoided"} · ends {c.endsOn}</p>
            {c.joined ? <span className="done-badge">You&apos;re in</span> : <JoinChallengeButton challengeId={c.id} />}
          </Card>
        ))}
      </div>

      <h2 className="section-title">Leaderboards</h2>
      <LeaderboardOptIn optedIn={user.leaderboardOptIn} />
      <div className="split">
        <Card title={`In ${view.local.label}`}><Board rows={view.local.rows} /></Card>
        <Card title="Across all areas"><Board rows={view.statewide.rows} /></Card>
      </div>
      {view.includesDemo ? <p className="muted">Entries marked (demo) are sample households so you can see how the community looks. They are not real people.</p> : null}
    </>
  );
}
