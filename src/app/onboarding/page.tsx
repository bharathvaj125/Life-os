import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/forms/onboarding-form";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { CheckCircle2, Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Get Started — Mission LiFE Baseline" };

export default async function OnboardingPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <>
      <p className="eyebrow">Quick 60-Second Setup</p>
      <h1>Find Your Starting Point</h1>
      <p className="intro">
        A few basic household inputs and last month&apos;s electricity units are all we need. We establish your baseline footprint and immediately unlock personalized rupee and carbon saving suggestions.
      </p>

      <div className="split">
        <Card title="Household & Energy Profile" className="card-accent-surya">
          <OnboardingForm />
        </Card>

        <div style={{ display: "grid", gap: "20px", alignContent: "start" }}>
          <Card title="Why LiFE-OS?" icon={<Sparkles size={20} className="card-icon surya" style={{ margin: 0 }} />}>
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <CheckCircle2 size={18} style={{ color: "var(--forest-600)", marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: "14px", color: "var(--forest-900)" }}>Start now, sign in later</strong>
                  <p style={{ margin: "2px 0 0", fontSize: "13px" }}>
                    Begin without an account in under a minute, or add an email and password to come back from any device. Already saved one? <Link className="text-link" href="/login">Sign in</Link>.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <CheckCircle2 size={18} style={{ color: "var(--forest-600)", marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: "14px", color: "var(--forest-900)" }}>Clear emission basis</strong>
                  <p style={{ margin: "2px 0 0", fontSize: "13px" }}>
                    Emissions use the national grid average from the Central Electricity Authority (FY 2024-25). It is a national average, not your local feeder.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <CheckCircle2 size={18} style={{ color: "var(--forest-600)", marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: "14px", color: "var(--forest-900)" }}>Strict Privacy Guarantees</strong>
                  <p style={{ margin: "2px 0 0", fontSize: "13px" }}>
                    Your consumption records remain isolated to your household. Neighborhood leaderboards are strictly opt-in.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div style={{ background: "var(--forest-900)", color: "#FFFFFF", borderRadius: "18px", padding: "24px 26px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--surya-500)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Mission LiFE Goal
            </span>
            <h3 style={{ color: "#FFFFFF", margin: "6px 0 10px", fontSize: "18px" }}>
              Pro-Planet People (P3)
            </h3>
            <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "13.5px", margin: 0 }}>
              &ldquo;To mobilize at least 1 billion Indians and other global citizens to take individual and collective action for protecting and preserving the environment in the period 2022 to 2028.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
