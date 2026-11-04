"use client";

import { useState } from "react";
import { Field, Stat } from "@/components/ui/field";
import { DEFAULT_APPLIANCES, INTENSITY_INDEX, PEAK_HOURS, bestStart, hourLabel, scheduleImpact, touchesPeak } from "@/lib/calculations/schedule";
import { inr, num } from "@/lib/format";

const hours = Array.from({ length: 24 }, (_, h) => h);

export function Scheduler() {
  const [starts, setStarts] = useState<Record<string, number>>(Object.fromEntries(DEFAULT_APPLIANCES.map((a) => [a.id, 19])));
  const [rate, setRate] = useState(6);
  const [surcharge, setSurcharge] = useState(0);
  const opts = { inrPerKwh: rate, peakSurchargePct: surcharge };

  const now = DEFAULT_APPLIANCES.map((a) => ({ a, impact: scheduleImpact(a, starts[a.id], opts) }));
  const best = DEFAULT_APPLIANCES.map((a) => scheduleImpact(a, bestStart(a), opts));
  const kgNow = now.reduce((s, r) => s + r.impact.kgPerMonth, 0);
  const kgBest = best.reduce((s, r) => s + r.kgPerMonth, 0);
  const surchargeNow = now.reduce((s, r) => s + (r.impact.peakSurchargeInrPerMonth ?? 0), 0);

  return (
    <>
      <div className="clock" role="img" aria-label="Relative grid emission intensity for each hour of the day, higher in the evening">
        {hours.map((h) => (
          <div key={h} className={PEAK_HOURS.includes(h) ? "clock-hour peak" : "clock-hour"} title={`${hourLabel(h)}: ${INTENSITY_INDEX[h]}× average`}>
            <div style={{ height: `${INTENSITY_INDEX[h] * 60}px` }} />
            <span>{h % 3 === 0 ? hourLabel(h).replace(" ", "") : ""}</span>
          </div>
        ))}
      </div>
      <p className="muted">Bars show a <strong>modelled</strong> relative emissions intensity (taller is dirtier). Orange hours are the typical 6–10 PM household peak. This is an illustrative model, not live grid data.</p>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Appliance</th><th>Runs / week</th><th>Start time</th><th>kg CO₂e / month</th><th>Best start</th></tr></thead>
          <tbody>
            {now.map(({ a, impact }) => (
              <tr key={a.id}>
                <td>{a.name}<br /><span className="muted">{a.kw} kW × {a.hours} h</span></td>
                <td>{a.runsPerWeek}</td>
                <td>
                  <select aria-label={`Start time for ${a.name}`} value={starts[a.id]} onChange={(e) => setStarts({ ...starts, [a.id]: Number(e.target.value) })}>
                    {hours.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                  </select>
                  {touchesPeak(starts[a.id], a.hours) ? <span className="chip warn">Peak</span> : null}
                </td>
                <td>{num(impact.kgPerMonth)}</td>
                <td>{hourLabel(bestStart(a))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="form-grid">
        <Field label="Your rate (₹ per unit)" type="number" min={1} step="0.01" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        <Field label="Peak surcharge from your DISCOM (%)" type="number" min={0} max={100} value={surcharge} onChange={(e) => setSurcharge(Number(e.target.value))} hint="Leave at 0 if your tariff has no time-of-day pricing." />
      </div>

      <div className="stats" aria-live="polite">
        <Stat label="Now (modelled)" value={`${num(kgNow)} kg CO₂e`} note="per month" />
        <Stat label="At best start times" value={`${num(kgBest)} kg CO₂e`} note="per month" tone="good" />
        <Stat label="Possible reduction" value={`${num(Math.max(0, kgNow - kgBest))} kg`} note={kgNow > 0 ? `${Math.max(0, Math.round(((kgNow - kgBest) / kgNow) * 100))}% of these appliances` : undefined} tone="good" />
        {surcharge > 0 ? <Stat label="Peak surcharge now" value={inr(surchargeNow)} note="per month, at your inputs" tone="warn" /> : null}
      </div>
    </>
  );
}
