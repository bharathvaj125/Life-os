"use client";

import { useState } from "react";
import { Field, Stat } from "@/components/ui/field";
import {
  type Appliance,
  INTENSITY_INDEX,
  PEAK_HOURS,
  bestStart,
  hourLabel,
  scheduleImpact,
  touchesPeak,
} from "@/lib/calculations/schedule";
import { inr, num } from "@/lib/format";
import { AlertCircle, Sun } from "lucide-react";

const hours = Array.from({ length: 24 }, (_, h) => h);
const solarHours = [10, 11, 12, 13, 14];

export function Scheduler({ appliances }: { appliances: Appliance[] }) {
  const [starts, setStarts] = useState<Record<string, number>>(
    Object.fromEntries(appliances.map((a) => [a.id, 19]))
  );
  const [rate, setRate] = useState(6);
  const [surcharge, setSurcharge] = useState(0);
  const opts = { inrPerKwh: rate, peakSurchargePct: surcharge };

  const now = appliances.map((a) => ({
    a,
    impact: scheduleImpact(a, starts[a.id], opts),
  }));
  const best = appliances.map((a) => scheduleImpact(a, bestStart(a), opts));
  const kgNow = now.reduce((s, r) => s + r.impact.kgPerMonth, 0);
  const kgBest = best.reduce((s, r) => s + r.kgPerMonth, 0);
  const surchargeNow = now.reduce(
    (s, r) => s + (r.impact.peakSurchargeInrPerMonth ?? 0),
    0
  );

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "14px" }}>
        <span className="chip" style={{ background: "var(--surya-50)", borderColor: "var(--surya-100)", color: "var(--surya-700)" }}>
          <Sun size={13} /> 10 AM–3 PM: High Solar Inflow (Cleanest)
        </span>
        <span className="chip warn">
          <AlertCircle size={13} /> 6 PM–10 PM: Thermal Peaking Hours (Dirtiest)
        </span>
      </div>

      <div
        className="clock"
        role="img"
        aria-label="Relative grid emission intensity curve across 24 hours of the day"
      >
        {hours.map((h) => {
          const isPeak = PEAK_HOURS.includes(h);
          const isSolar = solarHours.includes(h);
          let cls = "clock-hour";
          if (isPeak) cls += " peak";
          else if (isSolar) cls += " solar";

          return (
            <div
              key={h}
              className={cls}
              title={`${hourLabel(h)}: ${INTENSITY_INDEX[h]}× relative grid intensity factor`}
            >
              <div style={{ height: `${Math.round(INTENSITY_INDEX[h] * 68)}px` }} />
              <span>{h % 3 === 0 ? hourLabel(h).replace(" ", "") : ""}</span>
            </div>
          );
        })}
      </div>

      <p className="muted" style={{ fontSize: "12.5px", marginTop: "8px" }}>
        <strong>Modelled Grid Profile:</strong> Taller bars represent higher marginal grid-carbon intensity. Moving flexible loads like washing machines or EV charging to midday captures surplus rooftop and utility solar.
      </p>

      <div className="table-wrap" style={{ margin: "24px 0" }}>
        <table>
          <thead>
            <tr>
              <th>Appliance & Rating</th>
              <th>Runs / Week</th>
              <th>Scheduled Start</th>
              <th>Impact (kg CO₂e/mo)</th>
              <th>Optimal Clean Window</th>
            </tr>
          </thead>
          <tbody>
            {now.map(({ a, impact }) => {
              const optimal = bestStart(a);
              const inPeak = touchesPeak(starts[a.id], a.hours);
              return (
                <tr key={a.id}>
                  <td>
                    <strong>{a.name}</strong>
                    <div className="muted" style={{ fontSize: "12px" }}>
                      {a.kw} kW load × {a.hours} hr runtime
                    </div>
                  </td>
                  <td>{a.runsPerWeek} times</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <select
                        aria-label={`Start time for ${a.name}`}
                        value={starts[a.id]}
                        onChange={(e) =>
                          setStarts({ ...starts, [a.id]: Number(e.target.value) })
                        }
                        style={{ maxWidth: "130px", minHeight: "38px", padding: "6px 10px" }}
                      >
                        {hours.map((h) => (
                          <option key={h} value={h}>
                            {hourLabel(h)}
                          </option>
                        ))}
                      </select>
                      {inPeak ? (
                        <span className="chip warn" style={{ fontSize: "11px" }}>
                          In Peak
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <strong style={{ fontFamily: "JetBrains Mono, monospace" }}>
                      {num(impact.kgPerMonth)} kg
                    </strong>
                  </td>
                  <td>
                    <span
                      className="chip"
                      style={{
                        background: "var(--forest-50)",
                        color: "var(--forest-800)",
                        borderColor: "var(--forest-100)",
                        fontWeight: 700,
                      }}
                    >
                      {hourLabel(optimal)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="form-grid" style={{ marginBottom: "20px" }}>
        <Field
          label="Your average power tariff (₹ / unit)"
          type="number"
          min={1}
          step="0.01"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          hint="From your electricity bill (amount ÷ units)."
        />
        <Field
          label="DISCOM peak-hour surcharge (%)"
          type="number"
          min={0}
          max={100}
          value={surcharge}
          onChange={(e) => setSurcharge(Number(e.target.value))}
          hint="If your commercial or residential tariff has Time-of-Day (ToD) rates. Default 0%."
        />
      </div>

      <div className="stats" aria-live="polite">
        <Stat
          label="Emissions with current schedule"
          value={`${num(kgNow)} kg`}
          note="Estimated monthly CO₂e"
        />
        <Stat
          label="At optimal solar start times"
          value={`${num(kgBest)} kg`}
          note="Lowest grid-carbon intensity"
          tone="good"
        />
        <Stat
          label="Achievable monthly reduction"
          value={`${num(Math.max(0, kgNow - kgBest))} kg`}
          note={
            kgNow > 0
              ? `${Math.max(0, Math.round(((kgNow - kgBest) / kgNow) * 100))}% cleaner without spending ₹`
              : "Optimized"
          }
          tone="good"
        />
        {surcharge > 0 ? (
          <Stat
            label="Peak tariff surcharge penalty"
            value={inr(surchargeNow)}
            note="Avoidable monthly cost"
            tone="warn"
          />
        ) : null}
      </div>
    </>
  );
}
