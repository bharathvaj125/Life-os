"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL = ".card, .stat, .path-step, .sunarc-card, .path-card, .callout, .hour-card";
const SPOT = ".card, .stat, .path-card, .sunarc-card";

/**
 * Motion for the signed-in screens, added on top of finished pages: blocks rise into view as they are scrolled
 * to, and cards get a soft light that follows the pointer. Nothing here is needed to use the app. With reduced
 * motion switched on, or without script, the page simply shows as it is.
 */
export function MotionLayer() {
  const pathname = usePathname();

  // Rise into view. Runs again on every page change, because the shell stays mounted between pages.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const main = document.getElementById("main");
    if (!main) return;
    const timers: number[] = [];
    const waiting = new Set<HTMLElement>();

    const show = (el: HTMLElement) => {
      if (!waiting.delete(el)) return;
      io.unobserve(el);
      el.classList.add("is-in");
      const delay = Number.parseInt(el.style.getPropertyValue("--reveal-delay"), 10) || 0;
      // Once it has arrived, hand control back to the element's own hover styles.
      timers.push(window.setTimeout(() => el.classList.remove("reveal", "is-in"), 1100 + delay));
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) show(e.target as HTMLElement);
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
    );

    // A fast scroll can jump straight past a block without it ever being seen as visible, so anything that
    // is now above the bottom of the screen is shown too.
    // This runs straight from the scroll event, not an animation frame, so it also works in a tab that is not in front.
    let settle = 0;
    const check = () => {
      for (const el of [...waiting]) if (el.getBoundingClientRect().top < window.innerHeight) show(el);
    };
    // Checks while scrolling, and once more shortly after it stops, so the last position is never missed.
    const onScroll = () => {
      check();
      window.clearTimeout(settle);
      settle = window.setTimeout(check, 120);
    };

    const targets = Array.from(main.querySelectorAll<HTMLElement>(REVEAL));
    targets.forEach((el, i) => {
      // A short stagger between neighbours, capped so a long page never waits.
      el.style.setProperty("--reveal-delay", `${Math.min(i % 6, 5) * 70}ms`);
      el.classList.add("reveal");
      waiting.add(el);
      io.observe(el);
    });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(settle);
      timers.forEach((t) => window.clearTimeout(t));
      targets.forEach((el) => el.classList.remove("reveal", "is-in"));
    };
  }, [pathname]);

  // A soft light under the pointer on cards. Skipped on touch screens, where there is no pointer to follow.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(pointer: fine)").matches) return;
    let frame = 0;
    const onMove = (ev: PointerEvent) => {
      const card = (ev.target as Element | null)?.closest<HTMLElement>(SPOT);
      if (!card) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${ev.clientX - r.left}px`);
        card.style.setProperty("--my", `${ev.clientY - r.top}px`);
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
