import type { Metadata } from "next";
import { HomeProfileForm } from "@/components/register/home-profile-form";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My home" };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <>
      <p className="eyebrow">My home</p>
      <h1>Your home and equipment</h1>
      <p className="intro">
        {user.displayName}{user.email ? ` · ${user.email}` : ""}. Tell us what you own and every tip, daily task and tool follows. Nothing here is shown to other people.
      </p>
      <Card title="Home and equipment" className="card-accent-surya">
        <HomeProfileForm
          readOnly={user.isDemo}
          initial={{ pincode: user.pincode, householdSize: user.householdSize, homeType: user.homeType, ownership: user.ownership, roofAccess: user.roofAccess, equipment: user.equipment }}
        />
      </Card>
    </>
  );
}
