"use client";

import { useEffect, useState } from "react";
import { Sun, Zap } from "lucide-react";

/** Which part of the grid day it is in India right now: the evening peak, the midday solar window, or normal hours. */
function phaseNow() {
  const now = new Date();
  const ist = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
  const hour = ist.getHours();
  if (hour >= 18 && hour < 22) return { label: "Peak hours (6–10 PM)", peak: true };
  if (hour >= 10 && hour < 15) return { label: "Solar window (10 AM–3 PM)", peak: false };
  return { label: "Standard grid hours", peak: false };
}

export function GridPhase() {
  const [phase, setPhase] = useState<{ label: string; peak: boolean } | null>(null);

  useEffect(() => {
    const update = () => setPhase(phaseNow());
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  if (!phase) return null;
  return (
    <div className={`header-status ${phase.peak ? "peak" : ""}`} title="Current India Standard Time grid phase">
      <div className={`status-dot ${phase.peak ? "peak" : ""}`} aria-hidden="true" />
      {phase.peak ? <Zap size={13} aria-hidden="true" /> : <Sun size={13} aria-hidden="true" />}
      <span>{phase.label}</span>
    </div>
  );
}
