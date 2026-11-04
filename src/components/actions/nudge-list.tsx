import Link from "next/link";
import type { Nudge } from "@/lib/calculations/nudges";
import { inr, num } from "@/lib/format";
import { ArrowRight, Lightbulb, Zap } from "lucide-react";

export function NudgeList({ nudges }: { nudges: Nudge[] }) {
  if (!nudges.length) {
    return (
      <div style={{ padding: "24px", textAlign: "center", background: "var(--sand-50)", borderRadius: "12px" }}>
        <p className="muted" style={{ margin: 0 }}>
          No active nudges right now. Your habits are well optimized!
        </p>
      </div>
    );
  }

  return (
    <ul className="nudges">
      {nudges.map((n) => {
        const isLivePeak = n.id === "peak-now";
        return (
          <li key={n.id} className={isLivePeak ? "nudge nudge-live" : "nudge"}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isLivePeak ? (
                  <Zap size={18} style={{ color: "var(--surya-600)" }} />
                ) : (
                  <Lightbulb size={18} style={{ color: "var(--forest-700)" }} />
                )}
                <h3 style={{ margin: 0 }}>{n.title}</h3>
              </div>
              {isLivePeak ? (
                <span className="chip surya" style={{ fontSize: "11px" }}>
                  Active Peak Hour (6–10 PM)
                </span>
              ) : null}
            </div>

            <p style={{ margin: "6px 0 8px", fontWeight: 550, color: "var(--forest-900)" }}>
              {n.action}
            </p>

            <p className="muted" style={{ margin: "0 0 8px", fontSize: "13.5px" }}>
              <strong>Context:</strong> {n.why}
            </p>

            {n.savingKwhPerMonth || n.savingKgPerMonth ? (
              <div
                style={{
                  background: isLivePeak ? "var(--surya-100)" : "var(--forest-100)",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  display: "inline-block",
                  margin: "4px 0 10px",
                }}
              >
                <span className="saving" style={{ color: isLivePeak ? "var(--surya-700)" : "var(--forest-800)" }}>
                  Potential saving: ~{n.savingKwhPerMonth ? `${num(n.savingKwhPerMonth)} kWh` : `${num(n.savingKgPerMonth ?? 0)} kg CO₂e`} / month
                  {n.savingInrPerMonth ? ` · approx ${inr(n.savingInrPerMonth)} based on your bill` : ""}
                </span>
              </div>
            ) : null}

            {n.href ? (
              <div>
                <Link className="text-link" href={n.href} style={{ fontSize: "13.5px" }}>
                  Take action now <ArrowRight size={14} />
                </Link>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
