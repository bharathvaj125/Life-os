import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/forms/onboarding-form";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Get started" };

export default async function OnboardingPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <>
      <p className="eyebrow">TAKES ABOUT A MINUTE</p>
      <h1>Find your starting point</h1>
      <p className="intro">Four details and last month&apos;s electricity bill are enough. We calculate your footprint, then suggest the changes that matter most for your home.</p>
      <Card title="About your home">
        <OnboardingForm />
        <p className="muted">No account or password needed. Your details stay in this app and are never shown to others without your consent.</p>
      </Card>
    </>
  );
}
