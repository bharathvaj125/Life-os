import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Navigation } from "@/components/layout/navigation";
import { storageMode } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = { title: { default: "LiFE-OS | Mission LiFE", template: "%s | LiFE-OS" }, description: "A Mission LiFE citizen engagement platform for sustainable everyday habits." };

export default function RootLayout({ children }: { children: ReactNode }) {
  const demo = storageMode() === "local-demo";
  return <html lang="en"><body><a href="#main" className="skip-link">Skip to content</a><Navigation /><main id="main" className="container">{children}</main><footer className="container footer">LiFE-OS · HackCult 2026 · HC26-GEDA01 · {demo ? "Local demo storage" : "Supabase storage"} · <Link href="/admin">Administrator</Link></footer></body></html>;
}
