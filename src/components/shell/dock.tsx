"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Clock, House, LayoutDashboard, Leaf, ListChecks, MapPin, ShieldCheck, Store, Sun, TrendingUp, Trophy, Users, type LucideIcon } from "lucide-react";
import type { NavItem } from "@/lib/nav";

const ICONS: Record<string, LucideIcon> = { LayoutDashboard, Leaf, ListChecks, Clock, Users, Sun, Store, House, Camera, MapPin, ShieldCheck, TrendingUp, Trophy };

/** The floating menu at the bottom of every signed-in screen. The page you are on is highlighted. */
export function Dock({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  // The deepest matching item wins, so /installer/listing does not also light up /installer.
  const active = [...items].sort((a, b) => b.href.length - a.href.length).find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))?.href;

  return (
    <nav className="dock" aria-label="Main menu">
      {items.map((item) => {
        const Icon = ICONS[item.icon] ?? LayoutDashboard;
        return (
          <Link key={item.href} href={item.href} className="dock-item" aria-current={active === item.href ? "page" : undefined}>
            <span className="dock-icon">
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="dock-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
