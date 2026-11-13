"use client";

import { useEffect, useState } from "react";
import { istClock } from "@/lib/calculations/day";

type Phase = "dawn" | "day" | "dusk" | "night";
const ORDER: Phase[] = ["dawn", "day", "dusk", "night"];
const LABEL: Record<Phase, string> = { dawn: "Early morning", day: "Midday", dusk: "Evening", night: "Night" };

function phaseNow(): Phase {
  const h = istClock(new Date());
  return h >= 5 && h < 9 ? "dawn" : h >= 9 && h < 16.5 ? "day" : h >= 16.5 && h < 19.5 ? "dusk" : "night";
}

/** A row of Gujarati homes with rooftop solar, wind turbines and the sun. Tap the sun to move through the day. */
const HOUSES: { x: number; w: number; h: number; lit?: boolean }[] = [
  { x: 205, w: 56, h: 40 },
  { x: 272, w: 70, h: 52, lit: true },
  { x: 354, w: 52, h: 36 },
  { x: 418, w: 76, h: 46, lit: true },
  { x: 506, w: 58, h: 38 },
];

export function SolarScene({ compact = false }: { compact?: boolean }) {
  // Starts at "day" for the server render, then the visitor's own time of day is used.
  const [phase, setPhase] = useState<Phase>("day");
  useEffect(() => {
    const frame = requestAnimationFrame(() => setPhase(phaseNow()));
    return () => cancelAnimationFrame(frame);
  }, []);
  const next = () => setPhase(ORDER[(ORDER.indexOf(phase) + 1) % ORDER.length]);

  return (
    <figure className={`scene${compact ? " scene-compact" : ""}`} data-phase={phase}>
      <svg viewBox="0 0 600 270" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Homes with rooftop solar and wind turbines, shown at ${LABEL[phase].toLowerCase()}`}>
        <defs>
          <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--sky1)" }} />
            <stop offset="1" style={{ stopColor: "var(--sky2)" }} />
          </linearGradient>
          <radialGradient id="sc-glow"><stop offset="0" stopColor="#FFD08A" stopOpacity="0.85" /><stop offset="1" stopColor="#F5AE5C" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="600" height="270" fill="url(#sc-sky)" />
        <g className="sc-stars" fill="#fff">
          {[[60, 40], [120, 70], [220, 30], [300, 55], [380, 28], [470, 48], [540, 24], [180, 100]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.8 : 1.2} />)}
        </g>

        <g className="sc-cloud sc-cloud-a"><ellipse cx="140" cy="60" rx="38" ry="11" /><ellipse cx="165" cy="52" rx="26" ry="10" /></g>
        <g className="sc-cloud sc-cloud-b"><ellipse cx="400" cy="38" rx="30" ry="9" /><ellipse cx="420" cy="31" rx="20" ry="8" /></g>

        <g className="sc-sun" onClick={next} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), next())} role="button" tabIndex={0} aria-label="Change the time of day">
          <circle r="64" fill="url(#sc-glow)" />
          <g className="sc-rays">{Array.from({ length: 12 }, (_, i) => <line key={i} x1="0" y1="-32" x2="0" y2="-42" transform={`rotate(${i * 30})`} />)}</g>
          <circle className="sc-disc" r="24" />
        </g>

        <path className="sc-hill sc-hill-far" d="M0 200 C80 150 160 175 240 185 C330 160 430 150 600 190 V270 H0 Z" />
        <path className="sc-hill sc-hill-near" d="M0 225 C100 195 200 215 300 220 C400 205 500 200 600 222 V270 H0 Z" />

        {[{ x: 70, h: 96 }, { x: 128, h: 70 }].map((t, i) => (
          <g key={i} className="sc-turbine" transform={`translate(${t.x} ${232 - t.h})`}>
            <path d={`M0 ${t.h} L0 0`} className="sc-pole" />
            <g className={`sc-blades sc-blades-${i}`}>
              {[0, 120, 240].map((a) => <path key={a} d="M0 0 C-2.5 -10 -2 -20 0 -30 C2 -20 2.5 -10 0 0 Z" transform={`rotate(${a})`} />)}
              <circle r="3" />
            </g>
          </g>
        ))}

        <rect className="sc-ground" y="232" width="600" height="38" />
        {HOUSES.map((h, i) => {
          const base = 232;
          return (
            <g key={i} className="sc-house" style={{ ["--d" as string]: `${i * 0.35}s` }}>
              <rect className="sc-wall" x={h.x} y={base - h.h} width={h.w} height={h.h} />
              <path className="sc-roof" d={`M${h.x - 5} ${base - h.h} L${h.x + h.w / 2} ${base - h.h - 20} L${h.x + h.w + 5} ${base - h.h} Z`} />
              <path className="sc-panel" d={`M${h.x + h.w / 2 - 4} ${base - h.h - 15} L${h.x + h.w - 2} ${base - h.h - 3} L${h.x + h.w - 12} ${base - h.h - 1} L${h.x + h.w / 2 - 12} ${base - h.h - 11} Z`} />
              <rect className={`sc-window${h.lit ? " lit" : ""}`} x={h.x + 10} y={base - h.h + 10} width="10" height="12" rx="1.5" />
              <rect className={`sc-window${i % 2 ? " lit" : ""}`} x={h.x + h.w - 22} y={base - h.h + 10} width="10" height="12" rx="1.5" />
              <rect className="sc-door" x={h.x + h.w / 2 - 5} y={base - 18} width="10" height="18" rx="1.5" />
            </g>
          );
        })}
      </svg>
      <figcaption>
        <span>{LABEL[phase]}</span> · tap the sun to change the time of day
      </figcaption>
    </figure>
  );
}
