import Link from "next/link";
import type { ReactNode } from "react";
import { Leaf } from "lucide-react";
import { GuidedTour } from "@/components/guide/guided-tour";
import { Dock } from "@/components/shell/dock";
import { MotionLayer } from "@/components/motion/motion-layer";
import { GridPhase } from "@/components/shell/grid-phase";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { UserMenu } from "@/components/shell/user-menu";
import { homeFor, type Viewer } from "@/lib/auth/viewer";
import { NAV, ROLE_LABEL } from "@/lib/nav";
import { storageMode } from "@/lib/store";

/**
 * Everything a signed-in person sees around a page: the top bar, the floating menu for their role, and a
 * short footer. Technical details such as the storage mode are shown to administrators only.
 */
export function AppShell({ viewer, children }: { viewer: Viewer; children: ReactNode }) {
  const name = viewer.user?.displayName ?? "Administrator";
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="shell-top">
        <div className="shell-top-inner">
          <div style={{ display: "flex", alignItems: "center" }}>
            <Link href={homeFor(viewer.role)} className="brand" aria-label="LiFE-OS home">
              <div className="brand-badge" aria-hidden="true">
                <Leaf size={22} />
              </div>
              <span>
                LiFE<span style={{ color: "var(--surya-600)" }}>-OS</span>
              </span>
            </Link>
            <span className="role-chip">{ROLE_LABEL[viewer.role]}</span>
          </div>
          <div className="top-actions">
            {viewer.role === "citizen" ? <GuidedTour /> : null}
            {viewer.role === "citizen" ? <GridPhase /> : null}
            <ThemeToggle />
            <UserMenu name={name} roleLabel={ROLE_LABEL[viewer.role]} profileHref={viewer.role === "citizen" ? "/profile" : undefined} />
          </div>
        </div>
      </header>

      <MotionLayer />
      <main id="main" className="container app-main">
        {children}
      </main>

      <footer className="container footer" style={{ paddingTop: 0, borderTop: 0 }}>
        <div>
          <strong>LiFE-OS</strong> · Mission LiFE · HackCult 2026 · HC26-GEDA01
          <div style={{ marginTop: "4px", fontSize: "12px" }}>
            Grid factor: CEA national average, FY 2024-25. Solar: planning estimates using PM Surya Ghar subsidy slabs. Estimates, not audited figures.
          </div>
        </div>
        {viewer.role === "admin" ? (
          <span className="badge" style={{ fontSize: "11px", padding: "3px 10px" }}>
            {storageMode() === "local-demo" ? "Local demo storage" : "Supabase connected"}
          </span>
        ) : null}
      </footer>

      <Dock items={NAV[viewer.role]} />
    </>
  );
}
