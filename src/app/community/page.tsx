import type { Metadata } from "next";
import { JoinChallengeButton, LeaderboardOptIn } from "@/components/community/community-controls";
import { LeaderboardView } from "@/components/community/leaderboard-view";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/field";
import { TermHelp } from "@/components/ui/term-help";
import { requireUser } from "@/lib/auth/session";
import { num } from "@/lib/format";
import { getCommunityView } from "@/services/community";
import { CheckCircle, MapPin, Trophy, Users } from "lucide-react";

export const metadata: Metadata = { title: "Gamification & Community Impact" };

export default async function CommunityPage() {
  const user = await requireUser();
  const view = await getCommunityView(user);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p className="eyebrow">Requirement 3 · Gamification & Social Impact</p>
          <h1>Community Action Across Gujarat</h1>
          <p className="intro" style={{ marginBottom: "16px" }}>
            Collective sustainability goals for your neighborhood and district. Individual mindful habits combine into measurable megawatt-hours saved and tons of carbon avoided.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: "28px" }}>
        <h2 className="section-title" style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>Active Ward & Statewide Challenges</span>
          <TermHelp customTitle="Community Challenges" customText="Shared environmental targets for your PIN area or Gujarat state. Every micro-action and solar install counts toward the collective goal." />
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 className="section-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Citizen Honor Roll & District Leaderboards</span>
              <TermHelp termKey="points" />
            </h2>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Filter by your PIN ward, any Gujarat district, or statewide. Clear trust tiers ensure fair competition.
            </p>
          </div>
        </div>
      </div>

      {/* Trust tiers explainer banner */}
      <div
        style={{
          background: "var(--sand-50)",
          border: "1.5px solid var(--sand-200)",
          borderRadius: "14px",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🟢</span>
          <div>
            <strong style={{ fontSize: "13px", color: "var(--forest-900)" }}>Smart-Meter Active:</strong>
            <div style={{ fontSize: "12px", color: "var(--muted-text)" }}>
              Automated AMI readings directly from DISCOM meters. Zero manual manipulation possible.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🟡</span>
          <div>
            <strong style={{ fontSize: "13px", color: "var(--forest-900)" }}>Bill-Verified:</strong>
            <div style={{ fontSize: "12px", color: "var(--muted-text)" }}>
              Document-backed with utility bill photo/PDF; meter arithmetic and consumer ID verified.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>⚪</span>
          <div>
            <strong style={{ fontSize: "13px", color: "var(--forest-900)" }}>Self-Reported:</strong>
            <div style={{ fontSize: "12px", color: "var(--muted-text)" }}>
              Citizen entries checked against physical per-capita baseline plausibility bounds.
            </div>
          </div>
        </div>
      </div>

      <LeaderboardOptIn optedIn={user.leaderboardOptIn} />

      <LeaderboardView
        allRows={view.allRows}
        userPrefix={view.userPrefix}
        userRegion={view.userRegion}
      />

      {view.includesDemo ? (
        <div style={{ padding: "14px 18px", background: "var(--sand-50)", border: "1px solid var(--sand-200)", borderRadius: "12px", marginTop: "16px" }}>
          <p className="muted" style={{ margin: 0, fontSize: "12.5px" }}>
            ℹ️ Participants marked <em>(demo)</em> are simulated neighborhood households to demonstrate district and verification aggregation prior to state-wide deployment.
          </p>
        </div>
      ) : null}
    </>
  );
}
