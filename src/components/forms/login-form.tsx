"use client";

import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";

export function LoginForm() {
  const { pending, error, run, router } = useAction();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    await run(() => callApi("/api/v1/session/login", "POST", body), () => router.push("/dashboard"));
  }

  return (
    <form className="form narrow" onSubmit={submit} noValidate>
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <FormError message={error} />
      <Button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}
