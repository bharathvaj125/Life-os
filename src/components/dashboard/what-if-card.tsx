"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowUpRight, Sliders } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ASSUMPTIONS, whatIf } from "@/lib/calculations/what-if";

interface Props {
  acCount: number;
  hasGeyser: boolean;
  /** Last month's units and bill, when the household has entered them. */
  baseline?: { kwh: number; billInr?: number };
}

const fmt = (n: number, d = 0) => n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });

/**
 * A playground: slide a habit and see what it would save in a month, in units, carbon and rupees. It uses the
 * same assumptions as the action catalogue, shows them, and only offers the levers for equipment the home has.
 */
export function WhatIfCard({ acCount, hasGeyser, baseline }: Props) {
  const id = useId();
  const [acDegrees, setAc] = useState(acCount > 0 ? 2 : 0);
  const [geyserMinutes, setGeyser] = useState(hasGeyser ? 10 : 0);
  const [standbyOff, setStandby] = useState(true);

  const r = whatIf({ acCount, acDegrees, hasGeyser, geyserMinutes, standbyOff }, baseline);
  // The bar fills with the share of a typical month's units. It tops out at 25% so small savings still show.
  const fill = Math.min(100, ((r.pctOfBill ?? Math.min(25, r.kwhPerMonth / 4)) / 25) * 100);

  return (
    <Card title="Try a change" className="card-accent-surya" icon={<Sliders size={20} className="card-icon surya" style={{ margin: 0 }} />}>
      <p className="muted" style={{ margin: "0 0 16px" }}>Slide a habit and see what a month of it could save. Nothing is saved until you do it from Actions.</p>

      <div className="whatif">
        <div className="whatif-controls">
          {acCount > 0 ? (
            <div className="whatif-row">
              <label htmlFor={`${id}-ac`}>
                AC set <b>{acDegrees}°</b> warmer
              </label>
              <input id={`${id}-ac`} type="range" min={0} max={4} step={1} value={acDegrees} onChange={(e) => setAc(Number(e.target.value))} style={{ ["--fill" as string]: `${(acDegrees / 4) * 100}%` }} />
            </div>
          ) : null}
          {hasGeyser ? (
            <div className="whatif-row">
              <label htmlFor={`${id}-geyser`}>
                Geyser <b>{geyserMinutes} min</b> shorter a day
              </label>
              <input id={`${id}-geyser`} type="range" min={0} max={30} step={5} value={geyserMinutes} onChange={(e) => setGeyser(Number(e.target.value))} style={{ ["--fill" as string]: `${(geyserMinutes / 30) * 100}%` }} />
            </div>
          ) : null}
          <label className="whatif-toggle">
            <input type="checkbox" checked={standbyOff} onChange={(e) => setStandby(e.target.checked)} />
            <span className="whatif-switch" aria-hidden="true" />
            Switch standby devices off at the socket
          </label>
        </div>

        <div className="whatif-result" aria-live="polite">
          <p className="eyebrow" style={{ margin: 0 }}>A month of this saves</p>
          <div className="whatif-big">
            <span>{fmt(r.kwhPerMonth, 1)}</span> kWh
          </div>
          <div className="whatif-meter" role="img" aria-label={r.pctOfBill !== null ? `${fmt(r.pctOfBill, 1)}% of last month's units` : "Share of a typical month"}>
            <div style={{ width: `${fill}%` }} />
          </div>
          <ul>
            <li><b>{fmt(r.kgPerMonth, 1)} kg</b> less CO₂e</li>
            {r.inrPerMonth !== null ? <li><b>₹{fmt(r.inrPerMonth)}</b> at your average rate</li> : null}
            {r.pctOfBill !== null ? <li><b>{fmt(r.pctOfBill, 1)}%</b> of last month&apos;s units</li> : null}
          </ul>
        </div>
      </div>

      <p className="muted" style={{ margin: "14px 0 0", fontSize: "12.5px" }}>
        Assumes {ASSUMPTIONS.acHoursPerDay} hours of AC a day at {ASSUMPTIONS.acKw} kW and about {ASSUMPTIONS.acSavingPerDegree * 100}% saved per degree, a {ASSUMPTIONS.geyserKw} kW geyser, and about {ASSUMPTIONS.standbyKwhPerDay} kWh a day of standby load. Planning estimates, not a measurement of your home.
      </p>
      <div style={{ marginTop: "14px" }}>
        <Link className="text-link" href="/actions">
          Turn it into daily habits <ArrowUpRight size={14} style={{ verticalAlign: "-2px" }} />
        </Link>
      </div>
    </Card>
  );
}
