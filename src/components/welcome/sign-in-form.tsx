"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";

/** Manual sign-in for registered households and installers. Each role lands on its own home screen. */
export function SignInForm() {
  const { pending, error, run, router } = useAction();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    await run(
      () => callApi<{ home: string }>("/api/v1/session/login", "POST", body),
      (data) => router.push(data.home),
    );
  }

  return (
    <form className="form" onSubmit={submit} noValidate style={{ maxWidth: "none" }}>
      <Field label="Email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <FormError message={error} />
      <Button type="submit" disabled={pending} className="button-surya">
        {pending ? "Signing in…" : "Sign in"} <ArrowRight size={16} aria-hidden="true" />
      </Button>
    </form>
  );
}
