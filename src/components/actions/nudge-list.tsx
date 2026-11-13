"use client";

import { useState } from "react";
import Link from "next/link";
import type { Nudge } from "@/lib/calculations/nudges";
import { inr, num } from "@/lib/format";
import { ArrowRight, ChevronDown, ChevronUp, HelpCircle, Lightbulb, TrendingUp, Zap } from "lucide-react";

export function NudgeList({ nudges }: { nudges: Nudge[] }) {
  const [expandedWhy, setExpandedWhy] = useState<Record<string, boolean>>({});

  if (!nudges.length) {
    return (
      <div style={{ padding: "32px 20px", textAlign: "center", background: "var(--sand-50)", borderRadius: "14px", border: "1px dashed var(--sand-200)" }}>
        <p className="muted" style={{ margin: 0 }}>
          🌿 All systems optimal! No urgent consumption spikes or alerts right now.
        </p>
      </div>
    );
  }

  function toggleWhy(id: string) {
    setExpandedWhy((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      {nudges.map((n) => {
        const isLivePeak = n.id === "peak-now";
        const isUsageUp = n.id === "usage-up";
        const isExpanded = Boolean(expandedWhy[n.id]);

        return (
          <div
            key={n.id}
            style={{
              background: isLivePeak ? "var(--surya-50)" : "#FFFFFF",
              border: `1.5px solid ${isLivePeak ? "var(--surya-200)" : "var(--sand-200)"}`,
              borderLeft: `5px solid ${isLivePeak ? "var(--surya-600)" : isUsageUp ? "var(--terra-600)" : "var(--forest-600)"}`,
              borderRadius: "14px",
              padding: "18px 20px",
              boxShadow: "0 2px 8px rgba(11, 37, 25, 0.03)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: isLivePeak ? "var(--surya-100)" : "var(--forest-50)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isLivePeak ? "var(--surya-700)" : "var(--forest-700)",
                  }}
                >
                  {isLivePeak ? <Zap size={18} /> : isUsageUp ? <TrendingUp size={18} /> : <Lightbulb size={18} />}
                </div>
                <h3 style={{ margin: 0, fontSize: "17px", color: "var(--forest-900)" }}>
                  {n.title}
                </h3>
              </div>

              {/* Status pill */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {isLivePeak ? (
                  <span
                    className="chip"
                    style={{
                      background: "var(--surya-600)",
                      color: "#FFFFFF",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 10px",
                    }}
                  >
                    ⚡ Active Peak (6–10 PM)
                  </span>
                ) : isUsageUp ? (
                  <span className="chip" style={{ background: "var(--terra-100)", color: "var(--terra-600)", fontSize: "11px" }}>
                    Bill Alert
                  </span>
                ) : (
                  <span className="chip" style={{ fontSize: "11px" }}>
                    Recommendation
                  </span>
                )}
              </div>
            </div>

            {/* Core Action (High visual priority) */}
            <p style={{ margin: "4px 0 10px", fontSize: "15px", fontWeight: 600, color: "var(--forest-900)", lineHeight: "1.45" }}>
              {n.action}
            </p>

            {/* Clear, attractive savings tag */}
            {n.savingKwhPerMonth || n.savingKgPerMonth ? (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", margin: "6px 0 10px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background: isLivePeak ? "var(--surya-100)" : "var(--forest-50)",
                    color: isLivePeak ? "var(--surya-800)" : "var(--forest-800)",
                    border: `1px solid ${isLivePeak ? "var(--surya-200)" : "var(--forest-100)"}`,
                    padding: "4px 10px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  ⚡ Potential Saving: ~{n.savingKwhPerMonth ? `${num(n.savingKwhPerMonth)} kWh` : `${num(n.savingKgPerMonth ?? 0)} kg CO₂e`}/mo
                  {n.savingInrPerMonth ? ` (≈ ${inr(n.savingInrPerMonth)})` : ""}
                </span>
              </div>
            ) : null}

            {/* Clean bottom row: Expandable "Why" context + Action CTA */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--sand-200)", paddingTop: "10px", marginTop: "10px", flexWrap: "wrap", gap: "8px" }}>
              <button
                type="button"
                onClick={() => toggleWhy(n.id)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: "12.5px",
                  color: "var(--muted-text)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: 600,
                }}
              >
                <HelpCircle size={13} style={{ color: "var(--surya-600)" }} />
                <span>Why this nudge?</span>
                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {n.href ? (
                <Link
                  className="text-link"
                  href={n.href}
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    background: "var(--sand-50)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--sand-200)",
                  }}
                >
                  Act now <ArrowRight size={13} />
                </Link>
              ) : null}
            </div>

            {/* Expandable context drawer */}
            {isExpanded ? (
              <div
                style={{
                  marginTop: "8px",
                  background: "var(--sand-50)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "var(--muted-text)",
                  border: "1px solid var(--sand-200)",
                  lineHeight: "1.5",
                }}
              >
                <strong>Scientific Basis:</strong> {n.why}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
