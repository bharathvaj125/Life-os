"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef } from "react";
import { istClock } from "@/lib/calculations/day";
import { EMBLEM_INNER, EMBLEM_VIEWBOX } from "./emblem-inner";

/**
 * The LiFE-OS emblem, alive. The sun follows the real India time (low at dawn and dusk, high at noon, dim at
 * night), the turbine turns, the panel catches the light and the plug flashes. Point at it and everything lifts.
 * The drawing itself is a fixed constant from emblem-inner.ts, never built from user input.
 */
export function BrandMark({ size = 46 }: { size?: number }) {
  const svg = useRef<SVGSVGElement>(null);
  // Every copy of the emblem gets its own gradient names: a hidden copy (such as the opening animation) must not steal them.
  const uid = useId().replace(/:/g, "");
  const inner = useMemo(() => EMBLEM_INNER.replace(/id="be-([a-z0-9]+)"/g, `id="be-$1-${uid}"`).replace(/url\(#be-([a-z0-9]+)\)/g, `url(#be-$1-${uid})`), [uid]);

  useEffect(() => {
    const sun = svg.current?.querySelector<SVGGElement>(".be-sun");
    if (!sun) return;
    const place = () => {
      const hour = istClock(new Date());
      // Height above the horizon: 0 at 5 AM and 7 PM, 1 at midday. The sun settles up to 14 units lower at the ends of the day.
      const t = Math.min(1, Math.max(0, (hour - 5) / 14));
      sun.style.setProperty("--be-drop", `${((1 - Math.sin(Math.PI * t)) * 14).toFixed(1)}px`);
      sun.dataset.night = hour < 5 || hour >= 19 ? "1" : "0";
    };
    place();
    const id = window.setInterval(place, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <svg ref={svg} className="emblem" viewBox={EMBLEM_VIEWBOX} width={size} height={(size * 200) / 192} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: inner }} />
  );
}

/** The name in the brand's italic, with a leaf for the dot on the i. */
function Wordmark() {
  return (
    <span className="brand-word">
      L<span className="brand-i">ı</span>FE<span className="brand-os">-OS</span>
    </span>
  );
}

/** The emblem and the name, as a link home. */
export function BrandLogo({ href = "/", label = "LiFE-OS home", size = 46 }: { href?: string; label?: string; size?: number }) {
  return (
    <Link href={href} className="brand brand-interactive" aria-label={label}>
      <BrandMark size={size} />
      <Wordmark />
    </Link>
  );
}

/** The large version for the welcome screen: emblem, name and the tagline. */
export function BrandLockup({ size = 132 }: { size?: number }) {
  return (
    <div className="brand-lockup brand-interactive" role="img" aria-label="LiFE-OS, your Mission LiFE companion">
      <BrandMark size={size} />
      <div className="brand-lockup-text" aria-hidden="true">
        <Wordmark />
        <p>
          <i />
          <span>
            Your <b>M</b>ission LiFE Companion
          </span>
          <i />
        </p>
      </div>
    </div>
  );
}
