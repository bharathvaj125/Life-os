"use client";

import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FormError } from "@/components/ui/field";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";

/** Shows the saved email, or lets a household that started anonymously add an email and password. */
export function AccountCard({ email }: { email?: string }) {
  const { pending, error, run } = useAction();

  if (email) {
    return (
      <Card title="Your account" icon={<KeyRound size={20} className="card-icon" style={{ margin: 0 }} />}>
        <p style={{ margin: 0 }}>
          Saved as <strong>{email}</strong>. Sign in with it from any phone or laptop to see this household&apos;s progress.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Save your progress" icon={<KeyRound size={20} className="card-icon surya" style={{ margin: 0 }} />} className="card-accent-surya">
      <p style={{ marginTop: 0 }}>You are signed in on this browser only. Add an email and password to get back in from any device.</p>
      <form
        className="form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const body = Object.fromEntries(new FormData(e.currentTarget));
          void run(() => callApi("/api/v1/account", "POST", body));
        }}
      >
        <div className="form-grid">
          <Field label="Email" name="email" type="email" autoComplete="email" maxLength={120} required />
          <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required hint="At least 8 characters." />
        </div>
        <FormError message={error} />
        <div>
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save my account"}</Button>
        </div>
      </form>
    </Card>
  );
}
