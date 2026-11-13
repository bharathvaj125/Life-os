import type { ReactNode } from "react";

/** A circular progress meter. The percentage is clamped, so it can be fed raw ratios. */
export function Ring({ pct, label, children, size = 132 }: { pct: number; label: string; children?: ReactNode; size?: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamped}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-fill" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - clamped / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ ["--ring-c" as string]: c }} />
      </svg>
      <div className="ring-centre">{children}</div>
    </div>
  );
}
