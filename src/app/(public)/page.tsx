import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLockup } from "@/components/brand/brand-logo";
import { AdminLogin } from "@/components/admin/admin-controls";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { DemoAccounts } from "@/components/welcome/demo-accounts";
import { SolarScene } from "@/components/brand/solar-scene";
import { SignInForm } from "@/components/welcome/sign-in-form";
import { getViewer, homeFor } from "@/lib/auth/viewer";
import { adminEnabled } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Welcome" };

/** The front door. Signed-in people go straight to their own home screen; everyone else sees this. */
export default async function WelcomePage() {
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(viewer.role));

  return (
    <div className="auth-split">
      <section className="auth-left" aria-label="About LiFE-OS">
        <div className="bandhani auth-bandhani" aria-hidden="true" />
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <Link href="/about" className="chip surya" style={{ padding: "7px 16px" }}>
            How it works
          </Link>
        </div>

        <div className="auth-hero">
          <BrandLockup />
          <p className="eyebrow">Mission LiFE · your sustainability companion</p>
          <h1>
            Habits that keep the <em>grid</em> calm.
          </h1>
          <p style={{ fontSize: "18px", maxWidth: "540px" }}>
            Turn one electricity bill into a footprint, tips for the equipment you actually own, community goals and a rooftop solar plan.
          </p>
          <SolarScene />
        </div>

        <div className="auth-stats">
          <div>
            <b>0.71 kg</b>
            <span>CO₂ per kWh, India&apos;s grid average</span>
          </div>
          <div>
            <b>6–10 PM</b>
            <span>the evening peak we help you avoid</span>
          </div>
          <div>
            <b>3 roles</b>
            <span>households, installers and GEDA</span>
          </div>
        </div>
      </section>

      <section className="auth-right" aria-label="Sign in">
        <div className="auth-right-top">
          <ThemeToggle />
        </div>
        <div className="auth-form-wrap">
          <p className="eyebrow">Sign in</p>
          <h1>Welcome back</h1>
          <p className="intro" style={{ fontSize: "16px", marginBottom: "22px" }}>
            Sign in with your email, or look around first with a demo account.
          </p>

          <SignInForm />

          <div className="divider-label">or try a demo account</div>
          <DemoAccounts />

          <div className="auth-links">
            <span>
              New household? <Link className="text-link" href="/register">Create an account</Link>
            </span>
            <span>
              Solar installer? <Link className="text-link" href="/register?as=installer">Register your business</Link>
            </span>
          </div>

          {adminEnabled() ? (
            <details style={{ marginTop: "20px" }}>
              <summary style={{ cursor: "pointer", fontSize: "14px", fontWeight: 650, color: "var(--muted-text)" }}>GEDA administrator? Use the access code</summary>
              <div style={{ marginTop: "14px" }}>
                <AdminLogin />
              </div>
            </details>
          ) : null}
        </div>
      </section>
    </div>
  );
}
