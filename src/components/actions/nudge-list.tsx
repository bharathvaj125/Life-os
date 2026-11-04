import Link from "next/link";
import type { Nudge } from "@/lib/calculations/nudges";
import { inr, num } from "@/lib/format";

export function NudgeList({ nudges }: { nudges: Nudge[] }) {
  if (!nudges.length) return <p className="muted">No suggestions right now.</p>;
  return (
    <ul className="nudges">
      {nudges.map((n) => (
        <li key={n.id} className={n.id === "peak-now" ? "nudge nudge-live" : "nudge"}>
          <h3>{n.title}</h3>
          <p>{n.action}</p>
          <p className="muted">Why: {n.why}</p>
          {n.savingKwhPerMonth || n.savingKgPerMonth ? (
            <p className="saving">
              Could save about {n.savingKwhPerMonth ? `${num(n.savingKwhPerMonth)} kWh` : `${num(n.savingKgPerMonth ?? 0)} kg CO₂e`} a month
              {n.savingInrPerMonth ? `, around ${inr(n.savingInrPerMonth)} at your own rate` : ""}.
            </p>
          ) : null}
          {n.href ? <Link className="text-link" href={n.href}>Go there →</Link> : null}
        </li>
      ))}
    </ul>
  );
}
