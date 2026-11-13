"use client";

import { useEffect, useRef } from "react";
import { BrandMark } from "./brand-logo";

/**
 * A short opening animation the first time someone opens the app in a browser session: the emblem comes alive and
 * the name settles in. It is skipped for people who prefer reduced motion and for anyone who has already seen it
 * this session. Press anywhere or any key to skip it.
 */
export function IntroSplash() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const node = root.current;
    if (!node || !html.dataset.intro) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try {
        sessionStorage.setItem("lifeos-intro", "1");
      } catch {
        // Not remembered in private browsing; it will simply play again next visit.
      }
      node.classList.add("leaving");
      window.setTimeout(() => delete html.dataset.intro, 650);
    };
    const timer = window.setTimeout(finish, 3200);
    window.addEventListener("keydown", finish, { once: true });
    node.addEventListener("pointerdown", finish, { once: true });
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div ref={root} className="splash" role="presentation" aria-hidden="true">
      <div className="intro-inner">
        <div className="intro-mark"><BrandMark size={150} /></div>
        <p className="intro-word">
          {"LıFE-OS".split("").map((c, i) => (
            <span key={i} style={{ animationDelay: `${0.9 + i * 0.07}s` }} className={i >= 4 ? "intro-os" : ""}>{c}</span>
          ))}
        </p>
        <p className="intro-tag">Your Mission LiFE companion</p>
        <div className="intro-line" />
      </div>
    </div>
  );
}
