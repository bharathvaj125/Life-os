import { Info } from "lucide-react";
import { TASKS } from "@/features/gamification/tasks";
import { SELF_CLAIM_WEIGHT, SELF_CLAIM_WEIGHT_BILL_SCANNED, TYPED_BILL_WEIGHT, evidenceOf, rankingWeight, type Evidence } from "@/lib/calculations/ranking";
import type { TaskCategory } from "@/types";

const GROUPS: { title: string; note: string; categories: TaskCategory[] }[] = [
  { title: "Electricity", note: "Appliances, lighting, solar", categories: ["energy"] },
  { title: "Cooking gas", note: "LPG and cooking habits", categories: ["cooking"] },
  { title: "Vehicles", note: "Car, scooter, EV", categories: ["mobility"] },
  { title: "Community and learning", note: "Goals, solar plans, installs", categories: ["community"] },
];

const EVIDENCE_LABEL: Record<Evidence, string> = {
  photo: "Admin-checked photo",
  system: "The app saw it",
  bill: "From your bills",
  self: "Self-reported",
};

const pct = (w: number) => `${Math.round(w * 100)}%`;

/**
 * Explains the leaderboard score in the open: how much each kind of evidence counts, and what every action is worth.
 * It reads the same task list and weights the ranking uses, so it can never drift from the real scoring.
 */
export function ScoreGuide() {
  return (
    <details className="score-guide">
      <summary>
        <Info size={15} aria-hidden="true" /> How many points is each action worth, and how much does it count?
      </summary>
      <div className="score-guide-body">
        <p>
          <strong>Two numbers per action.</strong> The points are what the action is worth. The weight is how much of those points count on the leaderboard, and it depends only on how well the action is backed.
        </p>

        <table className="score-table">
          <thead>
            <tr><th>How it is backed</th><th>Counts on leaderboard</th></tr>
          </thead>
          <tbody>
            <tr><td>Photo an admin approved, or something the app saw (joining a goal, running the solar estimate)</td><td><b>100%</b></td></tr>
            <tr><td>Saving taken from bills you scanned</td><td><b>100%</b></td></tr>
            <tr><td>Saving taken from numbers you only typed</td><td><b>{pct(TYPED_BILL_WEIGHT)}</b></td></tr>
            <tr><td>Tick-box habit nobody can check, bill not scanned</td><td><b>{pct(SELF_CLAIM_WEIGHT)}</b></td></tr>
            <tr><td>Tick-box habit, once your bill is scanned</td><td><b>{pct(SELF_CLAIM_WEIGHT_BILL_SCANNED)}</b></td></tr>
          </tbody>
        </table>

        <p className="score-guide-note">
          There is no separate multiplier for electricity, gas or vehicles. An action&apos;s points already reflect how much it saves, so the big ones (a 5-star appliance, solar panels, bulbs) are worth 40 and the small daily habits 10 to 25. The weight is about proof, not about the topic.
        </p>

        {GROUPS.map((g) => {
          const tasks = TASKS.filter((t) => g.categories.includes(t.category));
          if (tasks.length === 0) return null;
          return (
            <div key={g.title} className="score-group">
              <h4>{g.title} <small>{g.note}</small></h4>
              <table className="score-table">
                <thead>
                  <tr><th>Action</th><th>Points</th><th>Backed by</th><th>Counts as</th></tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const e = evidenceOf(t.id);
                    return (
                      <tr key={t.id}>
                        <td>{t.title}<small>{t.cadence === "daily" ? " · daily" : t.cadence === "weekly" ? " · weekly" : " · once"}</small></td>
                        <td>{t.points}</td>
                        <td>{EVIDENCE_LABEL[e]}</td>
                        <td><b>{Math.round(t.points * rankingWeight(t.id, false))}</b>{e === "self" ? <small> ({Math.round(t.points * rankingWeight(t.id, true))} with a scanned bill)</small> : null}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        <div className="score-group">
          <h4>Savings on your bill <small>Footprint page</small></h4>
          <p className="score-guide-note">
            When your units fall by 5% or more against last month, you earn 30 points (5 to 9%), 50 points (10 to 19%) or 70 points (20% or more). They count in full if the bill was scanned and only {pct(TYPED_BILL_WEIGHT)} if the numbers were typed in. A fall of more than 50% earns nothing, because it is more likely a typing mistake.
          </p>
        </div>
      </div>
    </details>
  );
}
