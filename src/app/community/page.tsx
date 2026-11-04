import type { Metadata } from "next";
import { JoinChallengeButton, LeaderboardOptIn } from "@/components/community/community-controls";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/field";
import { requireUser } from "@/lib/auth/session";
import { num } from "@/lib/format";
import { getCommunityView, type LeaderRow } from "@/services/community";
import { Award, CheckCircle, MapPin, Trophy, Users } from "lucide-react";

export const metadata: Metadata = { title: "Gamification & Community Impact" };

function Board({ rows }: { rows: LeaderRow[] }) {
  if (!rows.length) {
    return (
      <div style={{ padding: "32px 20px", textAlign: "center", background: "var(--sand-50)", borderRadius: "12px" }}>
        <p className="muted" style={{ margin: 0 }}>
          No participants have opted into this leaderboard yet. Be the first citizen to lead!
        </p>
      </div>
    );
  }

  const medalColors: Record<number, string> = {
    1: "#D97706", // Gold
    2: "#6B7280", // Silver
    3: "#B45309", // Bronze
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Citizen</th>
            <th>Region</th>
            <th>Rank Level</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.rank}-${r.displayName}`} className={r.isYou ? "you" : undefined}>
              <td style={{ width: "60px" }}>
                {r.rank <= 3 ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      background: medalColors[r.rank],
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 800,
                    }}
                  >
                    {r.rank}
                  </span>
                ) : (
                  <span style={{ color: "var(--muted-light)", fontWeight: 600 }}>#{r.rank}</span>
                )}
              </td>
              <td>
                <strong>{r.displayName}</strong>
                {r.isYou ? (
                  <span className="chip surya" style={{ fontSize: "11px", marginLeft: "6px" }}>
                    You
                  </span>
                ) : null}
              </td>
              <td>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
                  <MapPin size={13} style={{ color: "var(--muted-light)" }} /> {r.region}
                </span>
              </td>
              <td>
                <span className="chip" style={{ fontSize: "11px" }}>
                  {r.level}
                </span>
              </td>
              <td>
                <strong style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--forest-900)" }}>
                  {num(r.points)}
                </strong>
              </td>
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
      <p className="eyebrow">Requirement 3 · Gamification & Social Impact</p>
      <h1>Better Together</h1>
      <p className="intro">
        Track community goals across Gujarat. Individual micro-actions combine into neighborhood-wide carbon reductions and collective milestones.
      </p>

      <div style={{ marginBottom: "28px" }}>
        <h2 className="section-title" style={{ marginTop: "16px" }}>
          Active Community Challenges
        </h2>
      </div>

      <div className="grid challenges">
        {view.challenges.map((c) => (
          <Card key={c.id} title={c.title} className="card-accent-green" icon={<Trophy size={20} className="card-icon" style={{ margin: 0 }} />}>
            <div className="badge-row">
              <span className="chip" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={12} /> {c.region}
              </span>
              <span className="chip" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Users size={12} /> {c.progress.members} members joined
              </span>
            </div>

            <p style={{ minHeight: "44px" }}>{c.description}</p>

            <div style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                <span>Goal progress</span>
                <span style={{ color: "var(--forest-800)" }}>{c.progress.pct}%</span>
              </div>
              <ProgressBar pct={c.progress.pct} label={`${c.title} progress`} />
              <p className="muted" style={{ fontSize: "12.5px" }}>
                <strong>{num(c.progress.value)}</strong> of {num(c.progress.target)}{" "}
                {c.metric === "actions" ? "actions logged" : "kg CO₂e avoided"} · Concludes {c.endsOn}
              </p>
            </div>

            {c.joined ? (
              <span className="done-badge" style={{ marginTop: "12px", display: "inline-flex" }}>
                <CheckCircle size={16} /> Participating in this goal
              </span>
            ) : (
              <JoinChallengeButton challengeId={c.id} />
            )}
          </Card>
        ))}
      </div>

      <div style={{ margin: "44px 0 16px" }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Honor Roll Leaderboards
        </h2>
        <p className="muted" style={{ margin: "4px 0 18px" }}>
          Opt-in rankings celebrating citizens adopting low-carbon lifestyle habits.
        </p>
      </div>

      <LeaderboardOptIn optedIn={user.leaderboardOptIn} />

      <div className="split">
        <Card title={`Local Area (${view.local.label})`} icon={<MapPin size={20} className="card-icon" style={{ margin: 0 }} />}>
          <Board rows={view.local.rows} />
        </Card>
        <Card title="Statewide (Gujarat & India)" icon={<Award size={20} className="card-icon surya" style={{ margin: 0 }} />}>
          <Board rows={view.statewide.rows} />
        </Card>
      </div>

      {view.includesDemo ? (
        <div style={{ padding: "14px 18px", background: "var(--sand-50)", border: "1px solid var(--sand-200)", borderRadius: "12px", marginTop: "16px" }}>
          <p className="muted" style={{ margin: 0, fontSize: "12.5px" }}>
            ℹ️ Participants marked <em>(demo)</em> are simulated neighborhood households to demonstrate local community aggregation prior to widespread rollout.
          </p>
        </div>
      ) : null}
    </>
  );
}
