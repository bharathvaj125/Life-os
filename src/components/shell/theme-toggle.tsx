"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Pref = "system" | "light" | "dark";
const ORDER: Pref[] = ["system", "light", "dark"];
const LABEL: Record<Pref, string> = { system: "Match my device", light: "Light", dark: "Dark" };

const stored = (): Pref => {
  try {
    const t = localStorage.getItem("lifeos-theme");
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
};

/** Applies a preference. "System" follows the device's own light or dark setting and keeps following it if that changes. */
function apply(pref: Pref) {
  const dark = pref === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches : pref === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.dataset.themePref = pref;
}

/** Cycles Match my device, Light and Dark, and remembers the choice on this device. The default matches the device. */
export function ThemeToggle() {
  const [pref, setPref] = useState<Pref>("system");

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPref(stored()));
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => stored() === "system" && apply("system");
    mq.addEventListener("change", onChange);
    return () => {
      cancelAnimationFrame(frame);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
    setPref(next);
    apply(next);
    try {
      if (next === "system") localStorage.removeItem("lifeos-theme");
      else localStorage.setItem("lifeos-theme", next);
    } catch {
      // Private browsing: the choice just will not be remembered.
    }
  }

  const Icon = pref === "system" ? Monitor : pref === "light" ? Sun : Moon;
  const nextLabel = LABEL[ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length]];
  return (
    <button type="button" className="icon-button" onClick={cycle} aria-label={`Theme: ${LABEL[pref]}. Switch to ${nextLabel}`} title={`Theme: ${LABEL[pref]} (press for ${nextLabel})`}>
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
