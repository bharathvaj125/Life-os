"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Flame, Gift, Sparkles, Trophy, Zap } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";

export interface GameDay {
  label: string;
  done: boolean;
  today: boolean;
}

export interface Quest {
  id: string;
  title: string;
  points: number;
  cadence: "daily" | "weekly" | "once";
}

interface Props {
  points: number;
  level: { level: number; name: string; from: number; nextAt: number | null; nextName: string | null; toNext: number };
  streak: { current: number; longest: number };
  week: GameDay[];
  pointsToday: number;
  dailyLimit: number;
  /** Tasks that can be claimed right now, biggest first. */
  quests: Quest[];
  /** Where the quest chips lead. On the Actions page itself they jump to the card. */
  questHref?: (q: Quest) => string;
  compact?: boolean;
}

const MILESTONES = [3, 7, 14, 30];
const CADENCE = { daily: "today", weekly: "this week", once: "once" } as const;

/** Pieces of confetti in fixed positions, so the burst looks scattered but renders the same on server and browser. */
const PIECES = Array.from({ length: 30 }, (_, i) => {
  const a = (i / 30) * Math.PI * 2 + Math.sin(i * 12.9898) * 0.5;
  const d = 90 + ((Math.sin(i * 78.233) + 1) / 2) * 120;
  return { x: Math.cos(a) * d, y: Math.sin(a) * d - 40, r: Math.round(Math.sin(i * 4.1) * 360), c: ["#FFD34D", "#3FA535", "#E8A210", "#7FE3F0", "#F08A5D"][i % 5], delay: (i % 6) * 18 };
});

function Confetti() {
  return (
    <span className="confetti" aria-hidden="true">
      {PIECES.map((p, i) => (
        <i key={i} style={{ ["--x" as string]: `${p.x}px`, ["--y" as string]: `${p.y}px`, ["--r" as string]: `${p.r}deg`, background: p.c, animationDelay: `${p.delay}ms` }} />
      ))}
    </span>
  );
}

/** The ring around the level badge, filling towards the next rank. */
function LevelRing({ pct, level }: { pct: number; level: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <div className="gd-ring">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="gd-ring-bg" />
        <circle cx="50" cy="50" r={r} className="gd-ring-fill" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      <span className="gd-ring-level"><small>LEVEL</small>{level}</span>
    </div>
  );
}

export function GameDeck({ points, level, streak, week, pointsToday, dailyLimit, quests, questHref, compact = false }: Props) {
  const streakNow = streak.current;
  const prev = useRef({ points, level: level.level, streak: streakNow });
  const [gain, setGain] = useState<{ n: number; key: number } | null>(null);
  const [levelUp, setLevelUp] = useState<string | null>(null);
  const [bump, setBump] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  // The page re-renders with fresh numbers after every claim. Notice what grew and celebrate it.
  useEffect(() => {
    const before = prev.current;
    prev.current = { points, level: level.level, streak: streakNow };
    const timers: number[] = [];
    if (points > before.points) {
      setGain({ n: points - before.points, key: Date.now() });
      timers.push(window.setTimeout(() => setGain(null), 1800));
    }
    if (level.level > before.level) {
      setLevelUp(level.name);
      timers.push(window.setTimeout(() => setLevelUp(null), 4200));
    }
    if (streakNow > before.streak) {
      setBump((b) => b + 1);
      setToast(MILESTONES.includes(streakNow) ? `${streakNow}-day streak unlocked!` : `Streak: ${streakNow} days`);
      timers.push(window.setTimeout(() => setToast(null), 3200));
    }
    return () => timers.forEach(window.clearTimeout);
  }, [points, level.level, level.name, streakNow]);

  const span = level.nextAt === null ? 1 : level.nextAt - level.from;
  const pct = level.nextAt === null ? 100 : Math.min(100, Math.max(0, Math.round(((points - level.from) / span) * 100)));
  const quotaPct = Math.min(100, Math.round((pointsToday / dailyLimit) * 100));
  const nextMilestone = MILESTONES.find((m) => m > streak.current);
  const heat = streak.current >= 14 ? "inferno" : streak.current >= 7 ? "blaze" : streak.current >= 3 ? "flame" : streak.current >= 1 ? "ember" : "cold";
  const todayDone = week.find((d) => d.today)?.done ?? false;
  const left = Math.max(0, dailyLimit - pointsToday);
  const reachable = Math.min(left, quests.filter((q) => q.cadence === "daily").reduce((s, q) => s + q.points, 0));

  return (
    <section className={`gd${compact ? " gd-compact" : ""}`} aria-label="Your progress">
      {/* ---- level ---- */}
      <div className="gd-card gd-level">
        <LevelRing pct={pct} level={level.level} />
        <div className="gd-body">
          <span className="gd-kicker">Rank</span>
          <strong className="gd-title">{level.name}</strong>
          <div className="gd-points">
            <Zap size={16} aria-hidden="true" />
            <CountUp value={points} /> pts
            {gain ? <span key={gain.key} className="gd-gain">+{gain.n}</span> : null}
            {gain ? <Confetti key={`c${gain.key}`} /> : null}
          </div>
          <div className="gd-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progress to the next rank"><i style={{ width: `${pct}%` }} /></div>
          <span className="gd-sub">{level.nextAt === null ? "Top rank reached" : `${level.toNext} pts to ${level.nextName}`}</span>
        </div>
      </div>

      {/* ---- streak ---- */}
      <div className={`gd-card gd-streak heat-${heat}`}>
        <div key={bump} className={`gd-flame${bump ? " bump" : ""}`} aria-hidden="true">
          <Flame size={compact ? 38 : 48} strokeWidth={1.6} />
        </div>
        <div className="gd-body">
          <span className="gd-kicker">Streak</span>
          <strong className="gd-title"><CountUp value={streak.current} /> {streak.current === 1 ? "day" : "days"}</strong>
          <div className="gd-week" role="list" aria-label="The last seven days">
            {week.map((d, i) => (
              <span key={i} role="listitem" className={`gd-day${d.done ? " done" : ""}${d.today ? " today" : ""}`} style={{ ["--i" as string]: i }} title={d.done ? "Done" : d.today ? "Today: not yet" : "Missed"}>
                <b>{d.done ? "✓" : ""}</b>
                <small>{d.label}</small>
              </span>
            ))}
          </div>
          <span className="gd-sub">
            {todayDone ? "Kept alive for today." : streak.current > 0 ? "Claim any daily task today to keep it alive." : "Claim a daily task to start a streak."}
            {nextMilestone ? ` ${nextMilestone - streak.current} more for the ${nextMilestone}-day badge.` : ""}
          </span>
          <div className="gd-badges">
            {MILESTONES.map((m) => (
              <span key={m} className={`gd-badge${streak.longest >= m ? " on" : ""}`} title={streak.longest >= m ? `${m}-day streak reached` : `Reach a ${m}-day streak`}>
                <Trophy size={11} aria-hidden="true" /> {m}d
              </span>
            ))}
          </div>
        </div>
        {toast ? <span className="gd-toast" role="status">{toast}</span> : null}
      </div>

      {/* ---- today ---- */}
      <div className="gd-card gd-today">
        <div className="gd-body">
          <span className="gd-kicker">Today</span>
          <strong className="gd-title">{pointsToday} <small>/ {dailyLimit} pts</small></strong>
          <div className="gd-bar quota" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={quotaPct} aria-label="Daily points used"><i style={{ width: `${quotaPct}%` }} /></div>
          <span className="gd-sub">
            {left === 0 ? "Daily cap reached. Photo-checked tasks still count." : reachable > 0 ? `Up to ${reachable} more points are waiting today.` : `${left} points of room left today.`}
          </span>
        </div>
        {quests.length > 0 ? (
          <ul className="gd-quests" aria-label="Points you can claim now">
            {quests.slice(0, compact ? 3 : 5).map((q) => (
              <li key={q.id}>
                <Link href={questHref ? questHref(q) : `#task-${q.id}`} className="gd-quest">
                  <span className="gd-coin" aria-hidden="true"><Gift size={13} /></span>
                  <span className="gd-quest-text">{q.title}<small>{CADENCE[q.cadence]}</small></span>
                  <b>+{q.points}</b>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {levelUp ? (
        <div className="gd-levelup" role="dialog" aria-label="Rank up" onClick={() => setLevelUp(null)}>
          <Confetti />
          <div className="gd-levelup-card">
            <Sparkles size={26} aria-hidden="true" />
            <small>RANK UP</small>
            <strong>{levelUp}</strong>
            <span>Your habits are adding up. Keep going!</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
