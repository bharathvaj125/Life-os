"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";

const links = [["/dashboard", "Dashboard"], ["/footprint", "Footprint"], ["/actions", "Actions"], ["/community", "Community"], ["/resources", "Resources"], ["/admin", "Admin"]];

export function Navigation() {
  const pathname = usePathname();
  return <header className="site-header"><div className="header-inner">
    <Link href="/" className="brand"><Leaf aria-hidden="true" size={25} /> LiFE-OS</Link>
    <nav aria-label="Main navigation">{links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</nav>
  </div></header>;
}
