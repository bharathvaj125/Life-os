import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Navigation } from "@/components/layout/navigation";
import { RegisterServiceWorker } from "@/components/layout/register-sw";
import { storageMode } from "@/lib/store";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LiFE-OS — Mission LiFE Citizen Engagement Platform",
    template: "%s | LiFE-OS",
  },
  description:
    "An interactive citizen engagement platform for sustainable energy habits, household carbon footprint tracking, community micro-tasks, and PM Surya Ghar rooftop solar feasibility.",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "LiFE-OS", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#0B2519", width: "device-width", initialScale: 1 };

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
        <RegisterServiceWorker />
        <Navigation />
        <main id="main" className="container">
          {children}
        </main>
        <footer className="container footer">
          <div>
            <strong>LiFE-OS</strong> · Mission LiFE (Lifestyle for Environment) · HackCult 2026 · Problem HC26-GEDA01
            <div style={{ marginTop: "4px", fontSize: "12px" }}>
              Grid factor: CEA national average, FY 2024-25 · Solar: planning estimates using PM Surya Ghar subsidy slabs. Estimates, not audited figures.
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
