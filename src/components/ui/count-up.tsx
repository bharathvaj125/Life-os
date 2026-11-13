"use client";

import { useEffect, useRef } from "react";

/**
 * A number that counts up to its value once when it appears. The server renders the final number, so the page
 * is correct without script and for anyone who prefers reduced motion; the count-up only decorates it.
 */
export function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const el = useRef<HTMLSpanElement>(null);
  const format = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  useEffect(() => {
    const node = el.current;
    if (!node || value === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    const duration = 800;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = format(value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // format only depends on decimals, which does not change for a mounted number
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span ref={el}>{format(value)}</span>;
}
