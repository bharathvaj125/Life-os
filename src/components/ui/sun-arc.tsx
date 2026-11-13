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

/**
 * The day as an arc over a rooftop: amber for the midday solar hours, coral for the evening peak, and a sun that
 * sits at the current time. It draws the same windows the task rules use, so what the picture says and what the
 * app allows always agree. Pure SVG, no script.
 */
export function SunArc({ hour, maxC }: { hour: number; maxC?: number | null }) {
  const advice = dayAdvice(hour);
  const [sx, sy] = at(hour);
  const night = hour < ARC_FROM || hour >= ARC_TO;

  return (
    <div className={`sunarc sunarc-${advice.phase}`}>
      <svg viewBox="0 -48 600 298" role="img" aria-label={`The day from 5 AM to 11 PM. Solar hours are ${SOLAR_FROM} AM to 3 PM and the evening peak is 6 to 10 PM. ${advice.title}.`}>
        <defs>
          <radialGradient id="sun-glow">
            <stop offset="0%" stopColor="#FFD08A" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F5AE5C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* the track, then the two windows on top of it */}
        <path d={band(ARC_FROM, ARC_TO)} className="sunarc-track" />
        <path d={band(SOLAR_FROM, SOLAR_TO)} className="sunarc-solar" />
        <path d={band(PEAK_FROM, PEAK_TO)} className="sunarc-peak" />

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

        {/* the sun, or a small moon-grey dot after dark */}
        {night ? null : (
          <g>
            <circle cx={sx} cy={sy} r="34" fill="url(#sun-glow)" />
            <circle cx={sx} cy={sy} r="11" className="sunarc-sun" />
          </g>
        )}
        {night ? <circle cx={at(ARC_TO)[0]} cy={at(ARC_TO)[1]} r="7" className="sunarc-moon" /> : null}
      </svg>

      <div className="sunarc-copy">
        <p className="eyebrow">Right now</p>
        <h2>{advice.title}</h2>
        <p>{advice.text}</p>
        {maxC != null ? <span className="chip">Today&apos;s high {Math.round(maxC)} °C</span> : null}
      </div>
    </div>
  );
}
