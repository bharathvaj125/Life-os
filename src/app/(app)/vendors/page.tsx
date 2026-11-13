import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, MessageSquare, ShieldAlert } from "lucide-react";
import { SolarScene } from "@/components/brand/solar-scene";
import { Card } from "@/components/ui/card";
import { VendorExplorer, type ExplorerVendor } from "@/components/vendors/vendor-explorer";
import { OFFICIAL_VENDOR_CHECKS, VENDOR_SERVICE_IDS, VERIFY_STEPS } from "@/features/vendors/catalog";
import { requireUser } from "@/lib/auth/session";
import { locateByPincode } from "@/lib/maps/locate";
import { listApprovedVendors } from "@/services/vendors";
import type { VendorService } from "@/types";

export const metadata: Metadata = { title: "Sustainable Energy Vendor Directory" };

export default async function VendorsPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const user = await requireUser();
  const { service: rawService } = await searchParams;
  const initialService = VENDOR_SERVICE_IDS.includes(rawService as VendorService) ? (rawService as VendorService) : undefined;
  const all = await listApprovedVendors();
  const vendors: ExplorerVendor[] = all.flatMap((v): ExplorerVendor[] => {
    const position = locateByPincode(v.pincode, v.id);
    if (!position) return [];
    // The demo installer account owns its listing, so it can take a request even though it is a demo.
    const demo = v.isSample && Boolean(v.ownerUserId);
    const kind = v.isSample && !demo ? "sample" : (v.listingKind ?? "installer");
    return [{ id: v.id, name: v.name, city: v.city, pincode: v.pincode, services: v.services, kind, phone: v.phone, website: v.website, claim: v.empanelmentClaim, demo, sourceUrl: v.sourceUrl, verifiedOn: v.verifiedOn, verifiedNote: v.verifiedNote, canRequest: kind === "installer" && Boolean(v.ownerUserId), position }];
  });
  const home = locateByPincode(user.pincode, "you") ?? ([22.6, 71.5] as [number, number]);

  return (
    <>
      <p className="eyebrow">Vendors</p>
      <h1>Find a Sustainable Energy Vendor</h1>
      <SolarScene compact />
      <p className="intro">
        Search by PIN code or place, or use your location. The nearest come first. Installers register here and an administrator reviews each listing; official bodies and companies are listed from their own public websites. Registered installers can take a quote request and reply to you in a conversation.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", margin: "0 0 18px" }}>
        <Link className="button button-outline" href="/quotes"><MessageSquare size={15} aria-hidden="true" /> My quote requests</Link>
      </div>

      <Card title="Verify before you pay" icon={<ShieldAlert size={20} className="card-icon surya" style={{ margin: 0 }} />} className="card-accent-surya">
        <p style={{ marginTop: 0 }}>
          A listing here is a starting point, not an endorsement. Anyone can claim to be an empanelled installer, so a claim is not proof. Where an administrator has found an installer on an official list, the card says so and shows the date. Otherwise, check it yourself.
        </p>
        <ol className="notes">
          {VERIFY_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" }}>
          {OFFICIAL_VENDOR_CHECKS.map((c) => (
            <a key={c.url} className="chip" href={c.url} target="_blank" rel="noopener noreferrer" title={c.note}>
              {c.title} <ExternalLink size={12} aria-hidden="true" />
            </a>
          ))}
        </div>
      </Card>

      <div style={{ height: "24px" }} />
      <VendorExplorer vendors={vendors} home={{ position: home, pincode: user.pincode }} initialService={initialService} />
    </>
  );
}
