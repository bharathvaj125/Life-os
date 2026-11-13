import { IntroSplash } from "@/components/brand/intro-splash";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { RegisterServiceWorker } from "@/components/layout/register-sw";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LiFE-OS — Mission LiFE Citizen Engagement Platform",
    template: "%s | LiFE-OS",
  },
  description:
    "An interactive citizen engagement platform for sustainable energy habits, household carbon footprint tracking, community micro-tasks, and PM Surya Ghar rooftop solar feasibility.",
  icons: { icon: [{ url: "/icons/logo.svg", type: "image/svg+xml" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "LiFE-OS", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#06130D", width: "device-width", initialScale: 1 };

/** Runs before the page paints, so the saved theme (dark by default) never flashes the wrong colours. */
const themeScript = `try{var d=document.documentElement,t=localStorage.getItem('lifeos-theme'),m=window.matchMedia('(prefers-color-scheme: light)').matches;d.dataset.theme=t==='light'||(t!=='dark'&&m)?'light':'dark';d.dataset.themePref=t==='light'||t==='dark'?t:'system';if(!sessionStorage.getItem('lifeos-intro')&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)d.dataset.intro='1'}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <IntroSplash />
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
