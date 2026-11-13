"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { istClock } from "@/lib/calculations/day";

/**
 * The LiFE-OS mark: a seedling under a rising sun. The sun follows the real India time, so it sits low at dawn
 * and dusk, high at noon and dims at night. Point at it and the sun lifts, the rays flare and the leaves sway.
 */
export function BrandMark({ size = 40 }: { size?: number }) {
  const sun = useRef<SVGGElement>(null);

  useEffect(() => {
    const node = sun.current;
    if (!node) return;
    const place = () => {
      const hour = istClock(new Date());
      const night = hour < 5 || hour >= 19;
      // Height above the horizon: 0 at 5 AM and 7 PM, 1 at midday.
      const t = Math.min(1, Math.max(0, (hour - 5) / 14));
      node.style.setProperty("--bm-drop", `${((1 - Math.sin(Math.PI * t)) * 6).toFixed(1)}px`);
      node.dataset.night = night ? "1" : "0";
    };
    place();
    const id = window.setInterval(place, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <svg className="brandmark" viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="bm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1B5237" />
          <stop offset="100%" stopColor="#0B2519" />
        </linearGradient>
        <linearGradient id="bm-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8FD0A8" />
          <stop offset="100%" stopColor="#3E9A6B" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#bm-bg)" />
      <g ref={sun} className="bm-sun">
        <g className="bm-rays">
          {Array.from({ length: 7 }, (_, i) => (
            <line key={i} x1="24" y1="9" x2="24" y2="13.5" transform={`rotate(${(i - 3) * 40} 24 23)`} />
          ))}
        </g>
        <circle cx="24" cy="23" r="7.2" className="bm-disc" />
      </g>
      <g className="bm-plant">
        <path d="M24 42 L24 32" className="bm-stem" />
        <path className="bm-leaf bm-leaf-l" d="M24 34 C17 34.5 12.5 31 12 26 C18.5 25.5 23.5 28.5 24 34 Z" />
        <path className="bm-leaf bm-leaf-r" d="M24 34 C31 34.5 35.5 31 36 26 C29.5 25.5 24.5 28.5 24 34 Z" />
      </g>
    </svg>
  );
}

/** The mark and the name, as a link home. */
export function BrandLogo({ href = "/", label = "LiFE-OS home", size = 40 }: { href?: string; label?: string; size?: number }) {
  return (
    <Link href={href} className="brand brand-interactive" aria-label={label}>
      <BrandMark size={size} />
      <span className="brand-word">
        LiFE<span className="brand-os">-OS</span>
      </span>
    </Link>
  );
}
