"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Check, Compass, Sparkles, X, Sun, Zap, Trophy, ShieldCheck } from "lucide-react";
import { MAX_DAILY_POINTS } from "@/lib/calculations/gamification";

interface Step {
  title: string;
  badge: string;
  icon: typeof Sparkles;
  description: string;
  actionHint: string;
  targetHref: string;
}

const STEPS: Step[] = [
  {
    title: "1. Know Your Real Baseline",
    badge: "Personalised Footprint",
    icon: Sparkles,
    description:
      "Enter last month's electricity units, or scan the bill itself. We work out your household carbon baseline with India's national grid emission factor from the Central Electricity Authority (FY 2024-25), and show every calculation.",
    actionHint: "Takes 1 minute · Add each new bill to see your trend.",
    targetHref: "/footprint",
  },
  {
    title: "2. Cleanest Hour Appliance Scheduling",
    badge: "Time-of-Day Balancing",
    icon: Sun,
    description:
      "When you run appliances matters as much as how much you run them. Running washing machines, geysers and pumps in the midday solar window (10 AM–3 PM) uses power that is about a quarter lower in carbon than the 6–10 PM peak, in our illustrative model.",
    actionHint: "Shift loads off-peak to save money if your tariff has Time-of-Day pricing.",
    targetHref: "/schedule",
  },
  {
    title: "3. Micro-Habits & Fair Points",
    badge: "Behavioural Nudges",
    icon: Zap,
    description:
      `Tick quick habits that fit your home, like setting the AC to 24°C. Each can be claimed once per day, week or lifetime, and habit points are capped at ${MAX_DAILY_POINTS} a day, so spamming does not work.`,
    actionHint: "Build streaks to level up from Seedling to Sapling and beyond.",
    targetHref: "/actions",
  },
  {
    title: "4. PM Surya Ghar Solar Feasibility",
    badge: "Actionable Resource Hub",
    icon: ShieldCheck,
    description:
      "Discover your rooftop solar potential. Our calculator sizes your system to your roof area and consumption, calculates realistic financial payback, and factors in up to ₹78,000 of central subsidy (a planning figure to confirm on the portal).",
    actionHint: "Includes direct official registration links and 4-step net-metering roadmap.",
    targetHref: "/resources",
  },
  {
    title: "5. Multi-Tier Community Honor Roll",
    badge: "Gamification & Trust",
    icon: Trophy,
    description:
      "Join local ward and district challenges. Leaderboards show how each result is backed: Bill-scanned (the bill's readings add up) or Self-reported. Smart-meter confirmation is planned.",
    actionHint: "Strict privacy: only your opt-in display name and points appear—never your bills.",
    targetHref: "/community",
  },
];

export function GuidedTour() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const step = STEPS[current];
  const Icon = step.icon;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setCurrent(0);
          setOpen(true);
        }}
        className="chip tour-trigger"
        style={{
          background: "var(--surya-50)",
          borderColor: "var(--surya-100)",
          color: "var(--surya-700)",
          cursor: "pointer",
          padding: "5px 12px",
          fontWeight: 650,
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
        }}
        title="Open interactive walkthrough of LiFE-OS features"
      >
        <Compass size={14} />
        <span>How LiFE-OS Works</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11, 37, 25, 0.45)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: "20px",
              maxWidth: "520px",
              width: "100%",
              padding: "28px 30px",
              boxShadow: "0 20px 50px -10px rgba(11, 37, 25, 0.25)",
              border: "1.5px solid var(--sand-200)",
              position: "relative",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close guide"
              style={{
                position: "absolute",
                top: "18px",
                right: "18px",
                background: "var(--sand-50)",
                border: "1px solid var(--sand-200)",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--muted-text)",
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "var(--surya-50)",
                  border: "1px solid var(--surya-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--surya-600)",
                }}
              >
                <Icon size={22} />
              </div>
              <div>
                <span className="chip surya" style={{ fontSize: "11px", marginBottom: "3px" }}>
                  {step.badge}
                </span>
                <h3 id="tour-title" style={{ margin: 0, fontSize: "20px", color: "var(--forest-900)" }}>
                  {step.title}
                </h3>
              </div>
            </div>

            <p style={{ fontSize: "14.5px", lineHeight: "1.6", color: "var(--muted-text)", margin: "0 0 16px" }}>
              {step.description}
            </p>

            <div
              style={{
                background: "var(--forest-50)",
                border: "1px solid var(--forest-100)",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "12.5px",
                color: "var(--forest-800)",
                fontWeight: 600,
                marginBottom: "24px",
              }}
            >
              💡 {step.actionHint}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {/* Progress Dots */}
              <div style={{ display: "flex", gap: "6px" }}>
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: i === current ? "20px" : "8px",
                      height: "8px",
                      borderRadius: "4px",
                      background: i === current ? "var(--surya-600)" : "var(--sand-200)",
                      transition: "all 0.25s ease",
                    }}
                  />
                ))}
              </div>

              {/* Navigation controls */}
              <div style={{ display: "flex", gap: "8px" }}>
                {current > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCurrent(current - 1)}
                    className="button button-outline"
                    style={{ padding: "8px 14px", fontSize: "13px" }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                ) : null}

                {current < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrent(current + 1)}
                    className="button button-surya"
                    style={{ padding: "8px 18px", fontSize: "13px" }}
                  >
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="button button-surya"
                    style={{ padding: "8px 20px", fontSize: "13px" }}
                  >
                    Got it! <Check size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

