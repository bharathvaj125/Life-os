"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { HelpCircle, Info } from "lucide-react";

const GLOSSARY: Record<string, { title: string; explanation: string; practicalTip?: string }> = {
  co2: {
    title: "kg CO₂e (Carbon Footprint)",
    explanation: "Kilograms of Carbon Dioxide Equivalent — the universal measure of greenhouse gases emitted from your household electricity, petrol/diesel vehicles, and cooking gas.",
    practicalTip: "1 kg CO₂ is emitted when you consume ~1.4 units of grid electricity in India.",
  },
  kwh: {
    title: "kWh (Electricity Unit)",
    explanation: "Kilowatt-hour — exactly 1 'Unit' printed on your DISCOM electricity bill (e.g. Torrent Power, UGVCL, PGVCL).",
    practicalTip: "Running a 1.5-ton split AC for 1 hour consumes roughly 1 to 1.5 kWh.",
  },
  kwp: {
    title: "kWp (Solar System Capacity)",
    explanation: "Kilowatt-Peak — the maximum electrical power your rooftop panels generate under clear, direct midday sunlight.",
    practicalTip: "A 1 kWp system requires ~10 m² (100 sq ft) of shadow-free terrace and generates 4–5 units per day.",
  },
  subsidy: {
    title: "PM Surya Ghar Subsidy",
    explanation: "Direct capital subsidy paid directly into your bank account under the PM Surya Ghar: Muft Bijli Yojana by the Central Government.",
    practicalTip: "₹30,000 for 1 kWp, ₹60,000 for 2 kWp, and capped at ₹78,000 for 3 kWp or larger systems.",
  },
  points: {
    title: "LiFE Habit Points",
    explanation: "Points earned by completing verified sustainable daily habits and peak-hour pledges. Capped at 30 points/day to guarantee fair competition.",
    practicalTip: "Points reflect daily effort; your actual carbon footprint is tracked from monthly utility bills.",
  },
  streak: {
    title: "Active Habit Streak",
    explanation: "The number of consecutive days you have logged in and completed at least one mindful energy or conservation micro-action.",
    practicalTip: "Streaks reset at midnight India Standard Time (IST) if no action is logged.",
  },
  cea: {
    title: "CEA v20.0 Baseline Factor",
    explanation: "Central Electricity Authority (Ministry of Power, Govt of India) official national grid emission factor (0.71 kg CO₂/kWh).",
    practicalTip: "Provides an authoritative, scientific calculation benchmark without guessing.",
  },
  tod: {
    title: "Time-of-Day (ToD) Balancing",
    explanation: "The grid's carbon intensity changes throughout the day. Midday has massive clean solar generation, while evening (6–10 PM) relies on thermal peaker plants.",
    practicalTip: "Shift geysers and washing machines to 10 AM–3 PM to consume green solar units.",
  },
  smart_meter: {
    title: "Smart-Meter Verified Tier",
    explanation: "Highest trust tier: automated readings confirmed through DISCOM Advanced Metering Infrastructure (AMI).",
    practicalTip: "Tamper-proof, zero manual entry required.",
  },
  bill_verified: {
    title: "Bill-Verified Tier",
    explanation: "Document-backed tier: citizen uploaded an official DISCOM utility bill where meter math and consumer IDs were validated.",
    practicalTip: "Carries the verified badge on neighborhood and district leaderboards.",
  },
  self_reported: {
    title: "Citizen Self-Reported Tier",
    explanation: "Citizen-entered figures checked against statistical plausibility minimums for the household size.",
    practicalTip: "Great for quick personal tracking and privacy preservation.",
  },
};

interface TermHelpProps {
  termKey?: keyof typeof GLOSSARY;
  customTitle?: string;
  customText?: string;
  children?: ReactNode;
  iconOnly?: boolean;
}

export function TermHelp({ termKey, customTitle, customText, children, iconOnly }: TermHelpProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const info = termKey ? GLOSSARY[termKey] : undefined;
  const title = customTitle ?? info?.title ?? "Explanation";
  const text = customText ?? info?.explanation ?? "";
  const tip = info?.practicalTip;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label={`What is ${title}?`}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          color: "inherit",
          font: "inherit",
          borderBottom: iconOnly ? "none" : "1px dashed var(--muted-light)",
        }}
      >
        {children}
        <HelpCircle
          size={13}
          style={{
            color: "var(--surya-600)",
            opacity: 0.85,
            marginLeft: iconOnly ? "0" : "3px",
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: "8px",
            width: "max-content",
            maxWidth: "300px",
            background: "#FFFFFF",
            color: "var(--forest-900)",
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1.5px solid var(--sand-200)",
            boxShadow: "0 8px 24px -4px rgba(11, 37, 25, 0.16)",
            zIndex: 1000,
            fontSize: "12.5px",
            lineHeight: "1.45",
            pointerEvents: "auto",
            display: "grid",
            gap: "4px",
            textAlign: "left",
          }}
        >
          <strong style={{ color: "var(--forest-900)", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Info size={14} style={{ color: "var(--surya-600)" }} />
            {title}
          </strong>
          <span style={{ color: "var(--muted-text)" }}>{text}</span>
          {tip ? (
            <span
              style={{
                marginTop: "4px",
                background: "var(--surya-50)",
                border: "1px solid var(--surya-100)",
                color: "var(--surya-700)",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "11.5px",
                fontWeight: 600,
              }}
            >
              💡 {tip}
            </span>
          ) : null}
          {/* Subtle triangle pointer */}
          <span
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              borderWidth: "6px 6px 0",
              borderStyle: "solid",
              borderColor: "#FFFFFF transparent transparent",
              filter: "drop-shadow(0 2px 2px rgba(11, 37, 25, 0.08))",
            }}
          />
        </span>
      ) : null}
    </span>
  );
}

