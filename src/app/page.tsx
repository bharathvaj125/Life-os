import Link from "next/link";
import { ArrowUpRight, BarChart3, Clock, Leaf, ListChecks, ShieldCheck, Sparkles, Sun, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

const pillars = [
  {
    icon: BarChart3,
    title: "Personalised Footprint",
    text: "Enter your monthly electricity units and get an instant carbon baseline anchored in CEA emissions factors. Track trends over time with zero guesswork.",
    tag: "0.71 kg CO₂/kWh CEA Baseline",
    href: "/footprint",
  },
  {
    icon: ListChecks,
    title: "Contextual Micro-Nudges",
    text: "Actionable energy-saving habits tailored to your bill size and the current time of day, with tamper-proof daily points and streaks.",
    tag: "Time-of-Day Aware",
    href: "/actions",
  },
  {
    icon: Users,
    title: "Community & Gamification",
    text: "Join PIN-code-level neighborhood goals, opt into privacy-safe leaderboards, and see collective tons of CO₂e avoided across Gujarat.",
    tag: "Privacy-Preserving",
    href: "/community",
  },
  {
    icon: Sun,
    title: "PM Surya Ghar Feasibility",
    text: "A transparent rooftop solar calculator estimating generation, net cost, and up to ₹78,000 in official subsidies with realistic payback.",
    tag: "Solar Subsidy Model",
    href: "/resources",
  },
];

const lifeThemes = [
  "⚡ Save Energy",
  "💧 Save Water",
  "🚫 Say No to Single-Use Plastic",
  "🌱 Sustainable Food Systems",
  "♻️ Waste Reduction",
  "🚴 Healthy Living",
  "🔌 E-Waste Responsibility",
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <>
      <section className="hero">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
          <span className="badge">
            <Leaf size={15} style={{ color: "var(--forest-700)" }} aria-hidden="true" /> Government of India · Mission LiFE
          </span>
          <span className="badge" style={{ background: "var(--surya-50)", borderColor: "var(--surya-100)", color: "var(--surya-700)" }}>
            <Sparkles size={14} aria-hidden="true" /> HackCult 2026 · HC26-GEDA01
          </span>
        </div>

        <p className="eyebrow">Lifestyle For Environment</p>
        <h1>
          Mindful habits.<br />
          <span style={{ color: "var(--surya-600)" }}>A resilient future.</span>
        </h1>

        <p className="intro">
          LiFE-OS connects everyday citizens with the nationwide Mission LiFE movement. Enter your last electricity bill to instantly unlock an accurate carbon baseline, rupee-saving micro-actions, a rooftop solar blueprint, and neighborhood challenges.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center", margin: "24px 0 36px" }}>
          <Link className="button button-surya" href={user ? "/dashboard" : "/onboarding"}>
            {user ? "Open My Dashboard" : "Calculate My Baseline"} <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <Link className="button button-outline" href="/schedule">
            <Clock size={16} aria-hidden="true" /> Explore Cleanest Hour
          </Link>
        </div>

        <div style={{ background: "var(--sand-100)", border: "1px solid var(--sand-200)", borderRadius: "14px", padding: "16px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest-800)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            7 LiFE Action Themes:
          </span>
          {lifeThemes.map((theme) => (
            <span key={theme} className="chip" style={{ fontSize: "12px", background: "#FFFFFF" }}>
              {theme}
            </span>
          ))}
        </div>
      </section>

      <div style={{ margin: "32px 0 16px" }}>
        <p className="eyebrow">Core Platform Capabilities</p>
        <h2>Everything you need to turn intent into measurable impact</h2>
      </div>

      <section aria-label="Core features" className="grid">
        {pillars.map(({ icon: Icon, title, text, tag, href }) => (
          <Card key={title} title={title}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Icon aria-hidden="true" size={24} className="card-icon" />
              <span className="chip surya">{tag}</span>
            </div>
            <p>{text}</p>
            <Link href={href} className="text-link" style={{ fontSize: "14px" }}>
              Explore feature →
            </Link>
          </Card>
        ))}
      </section>

      <section style={{ marginTop: "48px", background: "var(--forest-900)", color: "#FFFFFF", borderRadius: "20px", padding: "36px 32px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "24px" }}>
        <div style={{ maxWidth: "620px" }}>
          <div style={{ display: "inline-flex", gap: "8px", alignItems: "center", color: "var(--surya-500)", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            <ShieldCheck size={18} /> Official Data Standards
          </div>
          <h2 style={{ color: "#FFFFFF", fontSize: "28px", margin: "8px 0 12px" }}>
            Ground truth calculations, not arbitrary AI guesses.
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: 0, fontSize: "15.5px" }}>
            All footprint metrics strictly follow Central Electricity Authority (CEA) v20.0 grid factors. Solar generation estimates use European Commission PVGIS solar irradiance and MNRE PM Surya Ghar subsidy rules.
          </p>
        </div>
        <div>
          <Link className="button button-surya" href="/onboarding" style={{ padding: "14px 28px", fontSize: "16px" }}>
            Get Started in 60 Seconds
          </Link>
        </div>
      </section>
    </>
  );
}
