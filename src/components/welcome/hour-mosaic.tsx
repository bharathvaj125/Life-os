"use client";

import { useState } from "react";

/**
 * Decoration with a point: the 24 hours of a home's day as tiles. Amber is the midday solar window, coral is
 * the evening peak, green is ordinary hours and the dark tiles are the night. It is the idea behind Cleanest Hour.
 * Point at or tap a tile to read what that hour means.
 */
type Kind = "peak" | "solar" | "night" | "";
const kind = (hour: number): Kind => (hour >= 18 && hour < 22 ? "peak" : hour >= 10 && hour < 15 ? "solar" : hour < 6 || hour >= 22 ? "night" : "");

const MEANING: Record<Kind | "everyday", string> = {
  solar: "Solar hours: a good time for the pump and the washing machine",
  peak: "Evening peak: the grid is busiest, so hold the heavy loads",
  night: "Night: the grid is calm, a good time to charge an EV",
  "": "Everyday hour: standby switch-offs help at any time",
  everyday: "",
};

const label = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;

export function HourMosaic() {
  const [hour, setHour] = useState<number | null>(null);
  return (
    <>
      <div className="hour-mosaic" role="group" aria-label="A day in 24 hourly tiles: midday solar hours, the evening peak, ordinary hours and night">
        {Array.from({ length: 24 }, (_, h) => (
          <button
            key={h}
            type="button"
            className={`hour-tile ${kind(h)}${hour === h ? " is-active" : ""}`}
            style={{ animationDelay: `${h * 35}ms` }}
            aria-label={`${label(h)}. ${MEANING[kind(h)]}`}
            onMouseEnter={() => setHour(h)}
            onMouseLeave={() => setHour(null)}
            onFocus={() => setHour(h)}
            onBlur={() => setHour(null)}
            onClick={() => setHour(h)}
          />
        ))}
      </div>
      <p className="mosaic-readout" aria-live="polite">
        {hour === null ? "Point at an hour to see what it means" : <><b>{label(hour)}</b> · {MEANING[kind(hour)]}</>}
      </p>
      <div className="mosaic-legend" aria-hidden="true">
        <span><i style={{ background: "#F5AE5C" }} />Solar hours</span>
        <span><i style={{ background: "#FF9D84" }} />Evening peak</span>
        <span><i style={{ background: "rgba(109,190,144,0.5)" }} />Everyday</span>
      </div>
    </>
  );
}
