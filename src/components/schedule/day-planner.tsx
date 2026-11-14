"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CalendarCheck, Plus, RotateCcw, Save, Sparkles, Trash2, Wand2, X } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";
import { istClock } from "@/lib/calculations/day";
import {
  CATALOGUE,
  GUJARAT_TARIFF,
  type PlanItem,
  type Tariff,
  type TimeOfDay,
  energyBill,
  newPlanItem,
  planItem,
  planTotals,
} from "@/lib/calculations/planner";
import { INTENSITY_INDEX, PEAK_HOURS, hourLabel, windowIndex } from "@/lib/calculations/schedule";
import { inr, num } from "@/lib/format";

interface ProfileAppliance {
  name: string;
  kw: number;
  hours: number;
  daysPerWeek: number;
}

interface Props {
  /** The appliances this household said it owns, offered as a one-tap shortcut. Never added on their own. */
  fromProfile: ProfileAppliance[];
  /** Units a month from the latest bill, when there is one. */
  defaultUnits?: number;
}

const STORE = "lifeos-day-plan-v1";
const HISTORY = "lifeos-day-plan-history-v1";
const MAX_SAVED_DAYS = 60;

/** One saved day: the plan as it was, plus the totals at the time, so the list needs no recalculation. */
interface SavedDay {
  date: string;
  savedAt: string;
  items: PlanItem[];
  placed: number;
  kwhPerMonth: number;
  kgNow: number;
  saveKgPerMonth: number;
}

/** Today's date in India, as YYYY-MM-DD. */
const todayIst = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const monthLabel = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const shortDay = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const dayLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const MIN_IDX = 0.82;
const MAX_IDX = 1.16;
const RATES_DEFAULT = GUJARAT_TARIFF.slabs.map((s) => s.rate);

/** Green for the cleanest hours through amber to red for the dirtiest. */
const tint = (idx: number, alpha = 1) => {
  const t = Math.min(1, Math.max(0, (idx - MIN_IDX) / (MAX_IDX - MIN_IDX)));
  return `hsl(${Math.round(150 - 150 * t)} 68% ${46 - 4 * t}% / ${alpha})`;
};

/** Rupees with up to one decimal, so small daily amounts do not round to nothing. */
const rs = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 1 })}`;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const hours24 = Array.from({ length: 24 }, (_, h) => h);

/** The grid's day as one smooth curve: low in the solar hours, high in the evening. */
function Curve({ now }: { now: number | null }) {
  const pts = INTENSITY_INDEX.map((v, h) => [h * 10 + 5, 58 - ((v - MIN_IDX) / (MAX_IDX - MIN_IDX)) * 50] as const);
  let d = `M0 ${pts[0][1]} L${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    d += ` Q${x0 + 5} ${y0} ${(x0 + x1) / 2} ${(y0 + y1) / 2}`;
  }
  d += ` L240 ${pts[23][1]}`;
  return (
    <svg className="plan-curve" viewBox="0 0 240 64" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="plan-curve-fill" x1="0" x2="1" y1="0" y2="0">
          {hours24.map((h) => (
            <stop key={h} offset={(h + 0.5) / 24} stopColor={tint(INTENSITY_INDEX[h])} />
          ))}
        </linearGradient>
        <linearGradient id="plan-curve-fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.05" />
        </linearGradient>
        <mask id="plan-curve-mask"><path d={`${d} L240 64 L0 64 Z`} fill="url(#plan-curve-fade)" /></mask>
      </defs>
      <rect width="240" height="64" fill="url(#plan-curve-fill)" mask="url(#plan-curve-mask)" opacity="0.7" />
      <path d={d} fill="none" stroke="url(#plan-curve-fill)" strokeWidth="2.4" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      {now !== null ? <line x1={now * 10} x2={now * 10} y1="0" y2="64" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" opacity="0.6" /> : null}
    </svg>
  );
}

/** One appliance's day. Press or drag anywhere on the strip to place it; arrow keys nudge it an hour. */
function Lane({ item, best, onStart }: { item: PlanItem; best: number | null; onStart: (h: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const place = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const centre = ((clientX - r.left) / r.width) * 24;
    onStart(clamp(Math.round(centre - item.hours / 2), 0, 23));
  };
  const segments = (start: number) => {
    const first = Math.min(item.hours, 24 - start);
    const out = [{ s: start, len: first }];
    if (first < item.hours) out.push({ s: 0, len: item.hours - first });
    return out;
  };
  const idx = item.start === null ? 1 : windowIndex(item.start, item.hours);

  return (
    <div
      ref={ref}
      className={`plan-lane${item.start === null ? " empty" : ""}`}
      role="slider"
      tabIndex={0}
      aria-label={`${item.name}: when it runs`}
      aria-valuemin={0}
      aria-valuemax={23}
      aria-valuenow={item.start ?? undefined}
      aria-valuetext={item.start === null ? "Not placed yet" : `Starts at ${hourLabel(item.start)}`}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        place(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && place(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      onKeyDown={(e) => {
        const step = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        onStart(clamp((item.start ?? 12) + step, 0, 23));
      }}
    >
      {best !== null && item.start !== null && best !== item.start
        ? segments(best).map((g, i) => <span key={`b${i}`} className="plan-ghost" style={{ left: `${(g.s / 24) * 100}%`, width: `${(g.len / 24) * 100}%` }} />)
        : null}
      {item.start === null ? (
        <span className="plan-lane-hint">Choose the start time on the left, or tap here</span>
      ) : (
        segments(item.start).map((g, i) => (
          <span key={i} className="plan-block" style={{ left: `${(g.s / 24) * 100}%`, width: `${(g.len / 24) * 100}%`, background: `linear-gradient(135deg, ${tint(idx)}, ${tint(idx + 0.06)})`, boxShadow: `0 6px 18px -6px ${tint(idx, 0.7)}` }}>
            {i === 0 ? hourLabel(item.start as number).replace(" ", "") : ""}
          </span>
        ))
      )}
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max, step = 1, suffix }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  return (
    <label className="plan-num">
      <span>{label}</span>
      <span className="plan-num-box">
        <input type="number" inputMode="decimal" min={min} max={max} step={step} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(clamp(Number(e.target.value), min, max))} />
        {suffix ? <em>{suffix}</em> : null}
      </span>
    </label>
  );
}

export function DayPlanner({ fromProfile, defaultUnits }: Props) {
  const [items, setItems] = useState<PlanItem[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [units, setUnits] = useState(defaultUnits ?? 250);
  const [rates, setRates] = useState<number[]>(RATES_DEFAULT);
  const [fuel, setFuel] = useState(GUJARAT_TARIFF.fuelAdjInrPerKwh);
  const [duty, setDuty] = useState(GUJARAT_TARIFF.dutyPct);
  const [tod, setTod] = useState<TimeOfDay>({ peakExtraInr: 0, solarRebateInr: 0 });
  const [now, setNow] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [history, setHistory] = useState<SavedDay[]>([]);
  const [justSaved, setJustSaved] = useState(false);

  // Load what this person set up last time, then start the live clock. Nothing is pre-filled for a first visit.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORE) ?? "null");
        if (saved && Array.isArray(saved.items)) {
          setItems(saved.items);
          if (typeof saved.units === "number") setUnits(saved.units);
          if (Array.isArray(saved.rates) && saved.rates.length === 4) setRates(saved.rates);
          if (typeof saved.fuel === "number") setFuel(saved.fuel);
          if (typeof saved.duty === "number") setDuty(saved.duty);
          if (saved.tod) setTod(saved.tod);
        }
      } catch {
        // Nothing saved, or storage blocked: start empty.
      }
      try {
        const days = JSON.parse(localStorage.getItem(HISTORY) ?? "[]");
        if (Array.isArray(days)) setHistory(days);
      } catch {
        // No saved days yet.
      }
      setNow(istClock(new Date()));
      setReady(true);
    });
    const tick = window.setInterval(() => setNow(istClock(new Date())), 60_000);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ items, units, rates, fuel, duty, tod }));
    } catch {
      // Private browsing: the plan just will not be remembered.
    }
  }, [ready, items, units, rates, fuel, duty, tod]);

  const tariff: Tariff = useMemo(
    () => ({ slabs: GUJARAT_TARIFF.slabs.map((s, i) => ({ upTo: s.upTo, rate: rates[i] ?? s.rate })), fuelAdjInrPerKwh: fuel, dutyPct: duty }),
    [rates, fuel, duty]
  );
  // The appliances cannot use more than the whole household does, so the bill is sized to at least their own units.
  const applianceKwh = useMemo(() => planTotals(items, units, tariff, tod).kwhPerMonth, [items, units, tariff, tod]);
  const effUnits = Math.max(units, Math.ceil(applianceKwh));
  const totals = useMemo(() => planTotals(items, effUnits, tariff, tod), [items, effUnits, tariff, tod]);
  const plans = useMemo(() => items.map((i) => planItem(i, effUnits, tariff, tod)), [items, effUnits, tariff, tod]);

  const patch = useCallback((uid: string, change: Partial<PlanItem>) => setItems((list) => list.map((i) => (i.uid === uid ? { ...i, ...change } : i))), []);
  const add = (c: { name: string; kw: number; hours: number; daysPerWeek: number }) => {
    const uid = `a${crypto.randomUUID().slice(0, 8)}`;
    setItems((list) => [...list, newPlanItem(c, uid)]);
    setOpen(uid);
  };
  const moveAllToBest = () => setItems((list) => list.map((i) => (i.start === null ? i : { ...i, start: planItem(i, effUnits, tariff, tod)?.best ?? i.start })));

  /** Keeps today's plan in the list of saved days. Saving again on the same day replaces that day. */
  function saveToday() {
    const date = todayIst();
    const entry: SavedDay = { date, savedAt: new Date().toISOString(), items, placed: totals.placed, kwhPerMonth: totals.kwhPerMonth, kgNow: totals.kgNow, saveKgPerMonth: totals.saveKgPerMonth };
    const next = [entry, ...history.filter((d) => d.date !== date)].sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_SAVED_DAYS);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY, JSON.stringify(next));
    } catch {
      // Private browsing: the day just will not be remembered.
    }
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2500);
  }
  function removeDay(date: string) {
    const next = history.filter((d) => d.date !== date);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY, JSON.stringify(next));
    } catch {
      // Nothing to do.
    }
  }

  // Oldest first for the chart. Each saved day holds monthly-equivalent figures, so a month's average is the mean of its saved days.
  const trend = useMemo(() => [...history].sort((a, b) => a.date.localeCompare(b.date)).slice(-30), [history]);
  const monthly = useMemo(() => {
    const groups = new Map<string, SavedDay[]>();
    for (const d of history) groups.set(d.date.slice(0, 7), [...(groups.get(d.date.slice(0, 7)) ?? []), d]);
    return [...groups.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([ym, days]) => ({ ym, count: days.length, kwh: mean(days.map((d) => d.kwhPerMonth)), kg: mean(days.map((d) => d.kgNow)), save: mean(days.map((d) => d.saveKgPerMonth)) }));
  }, [history]);
  const peakKg = Math.max(1, ...trend.map((d) => d.kgNow));
  const first = trend[0];
  const last = trend[trend.length - 1];
  const change = first && last && trend.length > 1 && first.kgNow > 0 ? Math.round(((last.kgNow - first.kgNow) / first.kgNow) * 100) : null;

  const taken = new Set(items.map((i) => i.name));
  const profileLeft = fromProfile.filter((p) => !taken.has(p.name));
  const billNow = Math.round(energyBill(effUnits, tariff));
  const todOn = tod.peakExtraInr > 0 || tod.solarRebateInr > 0;

  return (
    <div className="planner">
      {/* ---- add what you actually run ---- */}
      <div className="plan-add">
        <p className="plan-step"><span>1</span> Pick the appliances you really run. Nothing is added for you.</p>
        <div className="plan-chips">
          {CATALOGUE.map((c) => (
            <button key={c.id} type="button" className="plan-chip" onClick={() => add(c)} disabled={taken.has(c.name)}>
              <Plus size={13} aria-hidden="true" /> {c.name}
            </button>
          ))}
          <button type="button" className="plan-chip custom" onClick={() => add({ name: "My appliance", kw: 1, hours: 1, daysPerWeek: 5 })}>
            <Sparkles size={13} aria-hidden="true" /> Something else
          </button>
        </div>
        {profileLeft.length > 0 ? (
          <button type="button" className="plan-link" onClick={() => profileLeft.forEach(add)}>
            <Wand2 size={14} aria-hidden="true" /> Add the {profileLeft.length} I told you I own
          </button>
        ) : null}
      </div>

      {/* ---- the day ---- */}
      <p className="plan-step"><span>2</span> Choose the time you usually run each one. Pick from the list, or tap the strip.</p>
      {items.length > 1 ? (
        <label className="plan-all">
          <span>Run them all at the same time?</span>
          <select value="" onChange={(e) => e.target.value !== "" && setItems((l) => l.map((i) => ({ ...i, start: Number(e.target.value) })))} aria-label="Set one start time for every appliance">
            <option value="">Pick one time for all</option>
            {hours24.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </select>
          <em>You can still change any one below.</em>
        </label>
      ) : null}
      <div className="plan-ribbon">
        <div className="plan-row plan-head">
          <div className="plan-name"><small>Grid carbon through the day</small><em>taller means dirtier</em></div>
          <div className="plan-track">
            <Curve now={now} />
            <div className="plan-zones" aria-hidden="true">
              <span className="z-solar" style={{ left: "41.667%", width: "20.833%" }}>☀ solar surge</span>
              <span className="z-peak" style={{ left: "75%", width: "16.667%" }}>evening peak</span>
            </div>
          </div>
        </div>
        {items.map((item, idx) => {
          const p = plans[idx];
          return (
            <div key={item.uid} className="plan-row">
              <div className="plan-name-col">
                <button type="button" className="plan-name plan-name-btn" onClick={() => setOpen(open === item.uid ? null : item.uid)} aria-expanded={open === item.uid} title="Change power, hours and days">
                  <strong>{item.name}</strong>
                  <small>{item.kw} kW{item.start !== null ? ` · ${hourLabel(item.start)} to ${hourLabel((item.start + item.hours) % 24)}` : ""} · edit</small>
                </button>
                <div className="plan-times">
                  <label>
                    <span>Starts</span>
                    <select className={item.start === null ? "unset" : ""} value={item.start ?? ""} aria-label={`When does ${item.name} start?`} onChange={(e) => patch(item.uid, { start: e.target.value === "" ? null : Number(e.target.value) })}>
                      <option value="">Choose</option>
                      {hours24.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Ends</span>
                    <select
                      disabled={item.start === null}
                      value={item.start === null ? "" : (item.start + item.hours) % 24}
                      aria-label={`When does ${item.name} stop?`}
                      onChange={(e) => item.start !== null && patch(item.uid, { hours: clamp(((Number(e.target.value) - item.start + 24) % 24) || 1, 1, 12) })}
                    >
                      {item.start === null ? <option value="">-</option> : null}
                      {hours24.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Runs for</span>
                    <select value={item.hours} aria-label={`How many hours does ${item.name} run?`} onChange={(e) => patch(item.uid, { hours: Number(e.target.value) })}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{h} {h === 1 ? "hour" : "hours"}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Days a week</span>
                    <select value={item.daysPerWeek} aria-label={`How many days a week do you run ${item.name}?`} onChange={(e) => patch(item.uid, { daysPerWeek: Number(e.target.value) })}>
                      {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d} {d === 1 ? "day" : "days"}</option>)}
                    </select>
                  </label>
                </div>
              </div>
              <div className="plan-track">
                <Lane item={item} best={p?.best ?? null} onStart={(h) => patch(item.uid, { start: h })} />
                {now !== null ? <i className="plan-now" style={{ left: `${(now / 24) * 100}%` }} aria-hidden="true" /> : null}
              </div>
              {open === item.uid ? (
                <div className="plan-edit">
                  <div className="plan-edit-grid">
                    <label className="plan-num plan-num-wide">
                      <span>Name</span>
                      <span className="plan-num-box"><input type="text" value={item.name} maxLength={40} onChange={(e) => patch(item.uid, { name: e.target.value })} /></span>
                    </label>
                    <NumberInput label="Power" value={item.kw} min={0.01} max={20} step={0.05} suffix="kW" onChange={(n) => patch(item.uid, { kw: n })} />
                    <label className="plan-num">
                      <span>It can run between</span>
                      <span className="plan-num-box plan-pair">
                        <select value={item.from} onChange={(e) => patch(item.uid, { from: Number(e.target.value), to: Math.max(item.to, Number(e.target.value) + 1) })}>
                          {hours24.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                        </select>
                        <ArrowRight size={14} aria-hidden="true" />
                        <select value={item.to} onChange={(e) => patch(item.uid, { to: Number(e.target.value) })}>
                          {Array.from({ length: 24 }, (_, i) => i + 1).filter((h) => h > item.from).map((h) => <option key={h} value={h}>{hourLabel(h % 24)}</option>)}
                        </select>
                      </span>
                    </label>
                  </div>
                  <button type="button" className="plan-remove" onClick={() => { setItems((l) => l.filter((i) => i.uid !== item.uid)); setOpen(null); }}>
                    <Trash2 size={14} aria-hidden="true" /> Remove
                  </button>
                </div>
              ) : null}
              {p ? (
                <div className="plan-result">
                  <span>Costs about <b>{inr(p.costPerMonth)}</b> a month ({rs(p.costPerMonth / 30)}/day) at your slab</span>
                  {p.best !== null && p.best !== item.start && p.saveKgPerMonth > 0 ? (
                    <button type="button" className="plan-move" onClick={() => patch(item.uid, { start: p.best })}>
                      <span>Run at {hourLabel(p.best)} instead: <b>{num(p.saveKgPerMonth)} kg</b> less CO₂/month{p.saveInrPerMonth > 0 ? <>, <b>{inr(p.saveInrPerMonth)}</b> saved</> : null}</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  ) : p.best !== null ? (
                    <span className="plan-good">Already in your cleanest slot ✓</span>
                  ) : (
                    <span className="muted">No slot fits in the hours you allowed.</span>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
        <div className="plan-row plan-axis">
          <div className="plan-name" />
          <div className="plan-track plan-ticks" aria-hidden="true">
            {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => <span key={h} style={{ left: `${(h / 24) * 100}%` }}>{hourLabel(h).replace(" ", "")}</span>)}
          </div>
        </div>
        {items.length === 0 ? (
          <div className="plan-empty">
            <b>Your day is empty.</b> Pick an appliance above, then tap the hour you run it. The ribbon turns green where the grid is cleanest and red in the evening peak.
          </div>
        ) : null}
      </div>

      {/* ---- the answer ---- */}
      <p className="plan-step"><span>3</span> What changes if you move them</p>
      {totals.placed === 0 ? (
        <p className="muted">Place at least one appliance on the day and your daily and monthly numbers appear here.</p>
      ) : (
        <>
          <div className="plan-hero" aria-live="polite">
            <div className="plan-big">
              <span>You could cut</span>
              <strong><CountUp value={totals.saveKgPerDay} decimals={2} /> <small>kg CO₂ a day</small></strong>
              <em><CountUp value={totals.saveKgPerMonth} decimals={1} /> kg a month · <CountUp value={Math.round(totals.saveKgPerMonth * 12)} /> kg a year</em>
            </div>
            <div className="plan-big money">
              <span>Money saved by shifting</span>
              <strong>{rs(totals.saveInrPerDay)} <small>a day</small></strong>
              <em>{inr(totals.saveInrPerMonth)} a month · {inr(totals.saveInrPerMonth * 12)} a year</em>
            </div>
            <div className="plan-big quiet">
              <span>These {totals.placed} appliance{totals.placed > 1 ? "s" : ""} use</span>
              <strong>{num(totals.kwhPerMonth)} <small>units a month</small></strong>
              <em>about {inr(totals.costPerMonth)} of a {inr(billNow)} energy bill</em>
            </div>
          </div>
          {applianceKwh > units ? (
            <p className="muted plan-fine">These appliances use more units than the {units} a month in your settings, so the bill above is sized to their own units. Raise “Units you use a month” if your home uses more.</p>
          ) : null}
          {!todOn ? (
            <p className="callout">
              An ordinary Gujarat home meter bills every hour the same, so moving a load saves carbon but not rupees. If your meter has time-of-day rates, enter them below and the rupee savings appear.
            </p>
          ) : null}
          <div className="plan-actions">
            <button type="button" className="button" onClick={moveAllToBest}><Wand2 size={15} aria-hidden="true" /> Move everything to its cleanest slot</button>
            <button type="button" className="button button-outline" onClick={() => setItems((l) => l.map((i) => ({ ...i, start: null })))}><RotateCcw size={15} aria-hidden="true" /> Clear the day</button>
          </div>
          <div className="plan-save">
            <button type="button" className="button button-surya" onClick={saveToday}>
              <Save size={15} aria-hidden="true" /> {history.some((d) => d.date === todayIst()) ? "Update today's saved plan" : "Save today's plan"}
            </button>
            <span role="status">{justSaved ? "Saved ✓" : "Saved on this device. Tomorrow, change the times and save again to keep a new day."}</span>
          </div>
        </>
      )}

      {/* ---- saved days ---- */}
      {history.length > 0 ? (
        <div className="plan-history">
          <p className="plan-step"><CalendarCheck size={18} aria-hidden="true" /> Your saved days and trend</p>

          <div className="plan-months">
            {monthly.map((m) => (
              <div key={m.ym} className="plan-month">
                <span>{monthLabel(m.ym)} average</span>
                <strong>{num(m.kg)} <small>kg CO₂ a month</small></strong>
                <em>{num(m.kg / 30)} kg a day · {num(m.kwh)} units a month · {m.count} day{m.count === 1 ? "" : "s"} saved</em>
                <em className="good">{m.save > 0 ? `${num(m.save)} kg a month could be saved by shifting` : "Already in the cleanest slots"}</em>
              </div>
            ))}
          </div>

          <div className="plan-trend" role="img" aria-label="Carbon of each saved day, oldest to newest">
            <div className="plan-trend-head">
              <b>Day by day</b>
              {change !== null ? <span className={change <= 0 ? "down" : "up"}>{change <= 0 ? "▼" : "▲"} {Math.abs(change)}% since {shortDay(first.date)}</span> : <span>Save more days to see a trend</span>}
            </div>
            <div className="plan-trend-bars">
              {trend.map((d) => {
                const kept = Math.max(0, d.kgNow - d.saveKgPerMonth);
                return (
                  <div key={d.date} className="plan-trend-col" title={`${dayLabel(d.date)}: ${num(d.kgNow)} kg CO₂ a month, ${num(d.saveKgPerMonth)} kg could be saved`}>
                    <div className="plan-trend-bar" style={{ height: `${Math.max(6, (d.kgNow / peakKg) * 100)}%` }}>
                      <i className="save" style={{ flexGrow: d.saveKgPerMonth }} />
                      <i className="kept" style={{ flexGrow: kept }} />
                    </div>
                    <small>{shortDay(d.date)}</small>
                  </div>
                );
              })}
            </div>
            <div className="plan-trend-key"><span><i className="kept" /> carbon you would still make</span><span><i className="save" /> could be saved by shifting</span></div>
          </div>

          <ul>
            {history.map((d) => (
              <li key={d.date}>
                <div className="plan-history-main">
                  <strong>{dayLabel(d.date)}{d.date === todayIst() ? " (today)" : ""}</strong>
                  <span>{d.placed} appliance{d.placed === 1 ? "" : "s"} · {num(d.kwhPerMonth)} units a month · {num(d.kgNow)} kg CO₂ a month</span>
                </div>
                <span className="plan-history-save">{d.saveKgPerMonth > 0 ? `${num(d.saveKgPerMonth)} kg could be saved` : "In the cleanest slots"}</span>
                <button type="button" className="plan-link" onClick={() => { setItems(d.items); setOpen(null); }}>Use this plan</button>
                <button type="button" className="plan-remove" onClick={() => removeDay(d.date)} aria-label={`Delete the saved plan for ${dayLabel(d.date)}`}><Trash2 size={14} aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ---- your numbers ---- */}
      <details className="plan-settings">
        <summary>Your tariff and meter (Gujarat defaults, change anything)</summary>
        <div className="plan-settings-body">
          <p className="muted">
            Slab rates are typical Gujarat residential energy charges for UGVCL, DGVCL, MGVCL and PGVCL. The fuel adjustment changes every quarter and Torrent Power areas differ a little, so check your own bill and edit what does not match.
          </p>
          <div className="plan-edit-grid">
            <NumberInput label="Units you use a month" value={units} min={10} max={3000} suffix="units" onChange={setUnits} />
            <NumberInput label="0 to 50 units" value={rates[0]} min={0} max={30} step={0.05} suffix="₹/unit" onChange={(n) => setRates((r) => r.map((v, i) => (i === 0 ? n : v)))} />
            <NumberInput label="51 to 100 units" value={rates[1]} min={0} max={30} step={0.05} suffix="₹/unit" onChange={(n) => setRates((r) => r.map((v, i) => (i === 1 ? n : v)))} />
            <NumberInput label="101 to 250 units" value={rates[2]} min={0} max={30} step={0.05} suffix="₹/unit" onChange={(n) => setRates((r) => r.map((v, i) => (i === 2 ? n : v)))} />
            <NumberInput label="Above 250 units" value={rates[3]} min={0} max={30} step={0.05} suffix="₹/unit" onChange={(n) => setRates((r) => r.map((v, i) => (i === 3 ? n : v)))} />
            <NumberInput label="Fuel adjustment" value={fuel} min={0} max={15} step={0.05} suffix="₹/unit" onChange={setFuel} />
            <NumberInput label="Electricity duty" value={duty} min={0} max={50} suffix="%" onChange={setDuty} />
          </div>
          <p className="plan-sub">Time-of-day rates (only if your meter has them)</p>
          <div className="plan-edit-grid">
            <NumberInput label={`Extra in the evening peak (${PEAK_HOURS[0] % 12} to ${(PEAK_HOURS[PEAK_HOURS.length - 1] + 1) % 12} PM)`} value={tod.peakExtraInr} min={0} max={10} step={0.1} suffix="₹/unit" onChange={(n) => setTod((t) => ({ ...t, peakExtraInr: n }))} />
            <NumberInput label="Discount in the solar hours (10 AM to 3 PM)" value={tod.solarRebateInr} min={0} max={10} step={0.1} suffix="₹/unit" onChange={(n) => setTod((t) => ({ ...t, solarRebateInr: n }))} />
          </div>
          <button type="button" className="plan-link" onClick={() => { setRates(RATES_DEFAULT); setFuel(GUJARAT_TARIFF.fuelAdjInrPerKwh); setDuty(GUJARAT_TARIFF.dutyPct); setTod({ peakExtraInr: 0, solarRebateInr: 0 }); }}>
            <X size={14} aria-hidden="true" /> Back to the Gujarat defaults
          </button>
        </div>
      </details>
      <p className="muted plan-fine">
        The hourly carbon curve is an illustrative model of a solar-heavy grid (midday lowest, evening peak highest), not live grid data. Carbon figures use the national average of 0.71 kg per unit scaled by that curve. Rupee costs use the slab rates above on top of your own units.
      </p>
    </div>
  );
}
