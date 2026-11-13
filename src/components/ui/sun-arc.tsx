"use client";

import { useEffect, useRef, useState } from "react";
import { ARC_FROM, ARC_TO, PEAK_FROM, PEAK_TO, SOLAR_FROM, SOLAR_TO, arcAngle, dayAdvice } from "@/lib/calculations/day";

const CX = 300;
const CY = 200;
const R = 220;

/** A point on the arc at a given hour. */
function at(hour: number, radius = R): [number, number] {
  const a = arcAngle(hour);
  return [CX - radius * Math.cos(a), CY - radius * Math.sin(a)];
}

/** An SVG path along the arc between two hours. */
function band(from: number, to: number): string {
  const [x1, y1] = at(from);
  const [x2, y2] = at(to);
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

const TICKS = [
  { hour: 6, label: "6 AM" },
  { hour: 12, label: "12 PM" },
  { hour: 18, label: "6 PM" },
  { hour: 22, label: "10 PM" },
];

type Zone = "solar" | "peak" | "everyday";

/** What each part of the arc means. These are the same windows the task rules use. */
const ZONES: Record<Zone, { eyebrow: string; title: string; text: string }> = {
  solar: { eyebrow: "10 AM to 3 PM", title: "Solar hours", text: "Midday sunshine. Run the water pump, the washing machine and other heavy loads now. If you have rooftop solar, you use your own power." },
  peak: { eyebrow: "6 PM to 10 PM", title: "Evening peak", text: "Everyone is home and the grid is at its busiest and dirtiest. Keep the geyser, washing machine and iron for after 10 PM." },
  everyday: { eyebrow: "Other hours", title: "Everyday hours", text: "Nothing special here. Standby switch-offs and shorter geyser time help at any hour." },
};

/**
 * The day as an arc over a rooftop: amber for the midday solar hours, coral for the evening peak, and a sun that
 * rises along the arc to the current time. Point at a part of the arc, or tab to it, to read what it means.
 * It draws the same windows the task rules use, so the picture and the app always agree.
 */
export function SunArc({ hour, maxC }: { hour: number; maxC?: number | null }) {
  const advice = dayAdvice(hour);
  const night = hour < ARC_FROM || hour >= ARC_TO;
  const [sx, sy] = at(hour);
  const [zone, setZone] = useState<Zone | null>(null);
  const sun = useRef<SVGGElement>(null);

  // The sun rises from the left end to where it is now. The server draws it already in place, so this only decorates.
  useEffect(() => {
    const node = sun.current;
    if (!node || night || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    const duration = 1400;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const [x, y] = at(ARC_FROM + (hour - ARC_FROM) * eased);
      node.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [hour, night]);

  const hover = (z: Zone | null) => ({ onMouseEnter: () => setZone(z), onMouseLeave: () => setZone(null), onFocus: () => setZone(z), onBlur: () => setZone(null) });
  const shown = zone ? ZONES[zone] : null;

  return (
    <div className={`sunarc sunarc-${advice.phase}${zone ? ` sunarc-zone-${zone}` : ""}`}>
      <svg viewBox="0 -48 600 298" role="group" aria-label={`The day from 5 AM to 11 PM. Solar hours are ${SOLAR_FROM} AM to 3 PM and the evening peak is 6 to 10 PM. ${advice.title}.`}>
        <defs>
          <radialGradient id="sun-glow">
            <stop offset="0%" stopColor="#FFD08A" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F5AE5C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* the track, then the two windows on top of it. Each is a target you can point at or tab to. */}
        <path d={band(ARC_FROM, ARC_TO)} className="sunarc-track sunarc-hit" tabIndex={0} aria-label="Everyday hours" {...hover("everyday")} />
        <path d={band(SOLAR_FROM, SOLAR_TO)} className="sunarc-solar sunarc-hit" tabIndex={0} aria-label="Solar hours, 10 AM to 3 PM" {...hover("solar")} />
        <path d={band(PEAK_FROM, PEAK_TO)} className="sunarc-peak sunarc-hit" tabIndex={0} aria-label="Evening peak, 6 to 10 PM" {...hover("peak")} />

        {/* the horizon and a rooftop with panels */}
        <line x1="40" y1={CY + 6} x2="560" y2={CY + 6} className="sunarc-ground" />
        <g className="sunarc-roof" transform={`translate(${CX - 62} ${CY - 34})`}>
          <path d="M0 40 L62 4 L124 40 Z" className="sunarc-roof-top" />
          <g className="sunarc-panels">
            <path d="M34 28 L54 17 L66 24 L46 35 Z" />
            <path d="M58 25 L78 14 L90 21 L70 32 Z" />
          </g>
        </g>

        {TICKS.map((t) => {
          const [x, y] = at(t.hour, R + 22);
          return (
            <text key={t.hour} x={x} y={y + 4} textAnchor="middle" className="sunarc-tick">
              {t.label}
            </text>
          );
        })}

        {/* inner labels for the two windows */}
        <text x={at(12.5, R - 30)[0]} y={at(12.5, R - 30)[1]} textAnchor="middle" className="sunarc-label sunarc-label-solar">Solar hours</text>
        <text x={at(20, R - 30)[0]} y={at(20, R - 30)[1] + 4} textAnchor="middle" className="sunarc-label sunarc-label-peak">Peak</text>

        {/* the sun, with slow rays, or a small grey dot after dark */}
        {night ? (
          <circle cx={at(ARC_TO)[0]} cy={at(ARC_TO)[1]} r="7" className="sunarc-moon" />
        ) : (
          <g ref={sun} transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)})`} pointerEvents="none">
            <circle r="34" fill="url(#sun-glow)" />
            <g className="sunarc-rays">
              {Array.from({ length: 10 }, (_, i) => (
                <line key={i} x1="0" y1="-17" x2="0" y2="-23" transform={`rotate(${i * 36})`} />
              ))}
            </g>
            <circle r="11" className="sunarc-sun" />
          </g>
        )}
      </svg>

      <div className="sunarc-copy" aria-live="polite">
        <p className="eyebrow">{shown ? shown.eyebrow : "Right now"}</p>
        <h2>{shown ? shown.title : advice.title}</h2>
        <p>{shown ? shown.text : advice.text}</p>
        {!shown && maxC != null ? <span className="chip">Today&apos;s high {Math.round(maxC)} °C</span> : null}
        {shown ? <span className="chip">Move off this part of the arc to see right now</span> : <span className="sunarc-hint">Point at the arc to see what each part means</span>}
      </div>
    </div>
  );
}
