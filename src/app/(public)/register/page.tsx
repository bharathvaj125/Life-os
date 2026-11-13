import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterWizard } from "@/components/register/register-wizard";
import { PublicHeader } from "@/components/shell/public-header";
import { getViewer, homeFor } from "@/lib/auth/viewer";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(viewer.role));
  const { as } = await searchParams;

  return (
    <>
      <PublicHeader />
      <main id="main" className="container" style={{ paddingBottom: "96px" }}>
        <RegisterWizard initialKind={as === "installer" ? "installer" : undefined} />
      </main>
    </>
  );
}
