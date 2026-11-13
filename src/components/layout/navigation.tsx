"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Sun, Zap } from "lucide-react";

const links = [
  ["/dashboard", "Dashboard"],
  ["/footprint", "Footprint"],
  ["/actions", "Actions"],
  ["/schedule", "Cleanest Hour"],
  ["/community", "Community"],
  ["/resources", "Solar & Hub"],
  ["/vendors", "Vendors"],
];

export function Navigation() {
  const pathname = usePathname();
  const [istInfo, setIstInfo] = useState<{ hour: number; label: string; isPeak: boolean; isSolar: boolean }>({
    hour: 12,
    label: "Solar window",
    isPeak: false,
    isSolar: true,
  });

  useEffect(() => {
    function updateIst() {
      // Calculate current IST (UTC + 5:30)
      const now = new Date();
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const istDate = new Date(utcMs + 5.5 * 3600000);
      const hour = istDate.getHours();

      const isPeak = hour >= 18 && hour < 22;
      const isSolar = hour >= 10 && hour < 15;
      let label = "Standard grid hours";
      if (isPeak) label = "Peak hours (6–10 PM)";
      else if (isSolar) label = "Solar window (10 AM–3 PM)";

      setIstInfo({ hour, label, isPeak, isSolar });
    }
    updateIst();
    const interval = setInterval(updateIst, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="LiFE-OS Homepage">
          <div className="brand-badge" aria-hidden="true">
            <Leaf size={22} />
          </div>
          <span>LiFE<span style={{ color: "var(--surya-600)" }}>-OS</span></span>
        </Link>

        <nav aria-label="Main navigation">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className={`header-status ${istInfo.isPeak ? "peak" : ""}`} title="Current India Standard Time grid phase">
          <div className={`status-dot ${istInfo.isPeak ? "peak" : ""}`} aria-hidden="true" />
          {istInfo.isPeak ? <Zap size={13} style={{ color: "var(--surya-600)" }} /> : <Sun size={13} style={{ color: "var(--forest-600)" }} />}
          <span>{istInfo.label}</span>
        </div>
      </div>
    </header>
  );
}
