import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <>
      <p className="eyebrow">Welcome back</p>
      <h1>Sign in to LiFE-OS</h1>
      <p className="intro">Use the email and password you saved with your household. Started without an account? Your progress stays on the browser you used, so just open the dashboard there.</p>
      <div style={{ maxWidth: "480px" }}>
        <Card title="Sign in">
          <LoginForm />
          <p className="muted" style={{ margin: "16px 0 0", fontSize: "13.5px" }}>
            New here? <Link className="text-link" href="/onboarding">Start in 60 seconds</Link>.
          </p>
        </Card>
      </div>
    </>
  );
}
