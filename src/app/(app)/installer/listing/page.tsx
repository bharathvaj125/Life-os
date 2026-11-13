import type { Metadata } from "next";
import { ListingForm } from "@/components/installer/listing-form";
import { Card } from "@/components/ui/card";
import { requireViewer } from "@/lib/auth/viewer";
import { getListing } from "@/services/installer";

export const metadata: Metadata = { title: "My listing" };

export default async function InstallerListingPage() {
  const { user } = await requireViewer("installer");
  const listing = user ? await getListing(user) : null;

  return (
    <>
      <p className="eyebrow">Installer · my listing</p>
      <h1>Your business listing</h1>
      <p className="intro">This is what citizens see in the vendor directory once an administrator approves it. Any change you save goes back for review.</p>
      <Card title="Listing details" className="card-accent-surya">
        <ListingForm
          readOnly={Boolean(user?.isDemo)}
          initial={{
            name: listing?.name ?? user?.displayName ?? "",
            city: listing?.city ?? "",
            pincode: listing?.pincode ?? user?.pincode ?? "",
            services: listing?.services ?? [],
            phone: listing?.phone,
            website: listing?.website,
            empanelmentClaim: listing?.empanelmentClaim,
          }}
        />
      </Card>
    </>
  );
}
