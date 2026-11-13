import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FileText, Sun } from "lucide-react";
import { SolarCalculator } from "@/components/solar/solar-calculator";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { RESOURCES } from "@/features/solar/resources";
import { listSnapshots } from "@/services/footprint";

export const metadata: Metadata = { title: "Actionable Resource Hub & Solar Feasibility" };

export default async function ResourcesPage() {
  const user = await requireUser();
  const latest = (await listSnapshots(user.id)).at(-1);
  const rate =
    latest?.billAmountInr && latest.electricityKwh
      ? Math.round((latest.billAmountInr / latest.electricityKwh) * 100) / 100
      : undefined;

  return (
    <>
      <p className="eyebrow">Requirement 4 · Actionable Resource Hub</p>
      <h1>From Intent to Rooftop</h1>
      <p className="intro">
        Explore rooftop solar feasibility for your property, calculate your PM Surya Ghar central subsidy entitlement, and access verified government energy transition resources.
      </p>

      <Card
        title="PM Surya Ghar: Muft Bijli Yojana Feasibility Engine"
        className="card-accent-surya"
        icon={<Sun size={22} className="card-icon surya" style={{ margin: 0 }} />}
      >
        <div style={{ marginBottom: "18px" }}>
          <p style={{ margin: 0, color: "var(--muted-text)" }}>
            Calculates optimal kWp capacity, annual kWh generation, financial payback, and the central subsidy using PM Surya Ghar subsidy slabs. These are planning estimates; confirm exact figures on the national portal before you apply.
          </p>
        </div>
        {user.equipment?.rooftopSolar ? (
          <div className="callout" style={{ marginBottom: "18px" }}>
            You already have rooftop solar. Use the estimator to size an extra system, and run heavy appliances between 10 AM and 3 PM to use your own power.
          </div>
        ) : user.roofAccess === "none" ? (
          <div className="callout surya" style={{ marginBottom: "18px" }}>
            You said you have no roof access, so a rooftop system may not be possible for now. Ask your housing society about a shared system, or try the estimator with a roof area you could use.
          </div>
        ) : user.roofAccess === "shared" ? (
          <div className="callout surya" style={{ marginBottom: "18px" }}>
            Your roof is shared, so a system needs your society&apos;s agreement. The estimate below is a good starting point for that conversation.
          </div>
        ) : null}
        <SolarCalculator
          defaultMonthlyKwh={latest?.electricityKwh}
          defaultTariff={rate}
          defaultPincode={user.pincode}
          signedIn
        />
      </Card>

      <div style={{ margin: "44px 0 16px" }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Official 4-Step Solar Roadmap
        </h2>
        <p className="muted" style={{ margin: "4px 0 20px" }}>
          How to turn your estimate into a commissioned net-metered rooftop installation.
        </p>
      </div>

      <div className="grid four">
        <Card title="1. Eligibility & Portal" icon={<span className="chip surya" style={{ fontSize: "14px", fontWeight: 800 }}>01</span>}>
          <p style={{ fontSize: "14px" }}>
            Register on the national <strong>PM Surya Ghar</strong> portal with your DISCOM consumer account number and mobile number.
          </p>
        </Card>
        <Card title="2. Technical Approval" icon={<span className="chip surya" style={{ fontSize: "14px", fontWeight: 800 }}>02</span>}>
          <p style={{ fontSize: "14px" }}>
            Submit an online net-metering application. Your local DISCOM reviews transformer capacity and issues technical feasibility approval (TFR).
          </p>
        </Card>
        <Card title="3. Empanelled Installer" icon={<span className="chip surya" style={{ fontSize: "14px", fontWeight: 800 }}>03</span>}>
          <p style={{ fontSize: "14px" }}>
            Select an authorized vendor from the portal roster. The installer performs a physical survey covering shade, orientation, and structural integrity.{" "}
            <Link className="text-link" href="/vendors">Browse the vendor directory</Link>.
          </p>
        </Card>
        <Card title="4. Inspection & DBT Subsidy" icon={<span className="chip surya" style={{ fontSize: "14px", fontWeight: 800 }}>04</span>}>
          <p style={{ fontSize: "14px" }}>
            DISCOM inspects the plant, installs a bidirectional net meter, and issues a commissioning certificate. The central subsidy is deposited directly to your bank.
          </p>
        </Card>
      </div>

      <div style={{ margin: "44px 0 16px" }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Curated Official Resources
        </h2>
        <p className="muted" style={{ margin: "4px 0 20px" }}>
          Direct links to authoritative schemes, databases, and policy guidelines.
        </p>
      </div>

      <div className="grid">
        {RESOURCES.map((r) => (
          <Card key={r.url} title={r.title} icon={<FileText size={18} className="card-icon" style={{ margin: 0 }} />}>
            <p style={{ fontSize: "14px", minHeight: "44px" }}>{r.description}</p>
            <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <a
                className="text-link"
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "13.5px" }}
              >
                {r.provider} <ExternalLink size={13} aria-hidden="true" />
              </a>
              <span className="muted" style={{ fontSize: "11.5px" }}>
                Checked {r.checkedOn}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
