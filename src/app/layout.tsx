import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Navigation } from "@/components/layout/navigation";
import { storageMode } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LiFE-OS — Mission LiFE Citizen Engagement Platform",
    template: "%s | LiFE-OS",
  },
  description:
    "An interactive citizen engagement platform for sustainable energy habits, CEA CO₂ baseline footprint tracking, community micro-tasks, and PM Surya Ghar rooftop solar feasibility.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const isDemo = storageMode() === "local-demo";
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Navigation />
        <main id="main" className="container">
          {children}
        </main>
        <footer className="container footer">
          <div>
            <strong>LiFE-OS</strong> · Mission LiFE (Lifestyle for Environment) · HackCult 2026 · Problem HC26-GEDA01
            <div style={{ marginTop: "4px", fontSize: "12px" }}>
              Baseline data: Central Electricity Authority (CEA) CO₂ Baseline Database v20.0 · Solar: PM Surya Ghar guidelines & PVGIS averages.
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <span className="badge" style={{ fontSize: "11px", padding: "3px 10px" }}>
              {isDemo ? "Local demo storage" : "Supabase connected"}
            </span>
            <Link href="/admin" className="text-link" style={{ fontSize: "12px" }}>
              Administrator View →
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
