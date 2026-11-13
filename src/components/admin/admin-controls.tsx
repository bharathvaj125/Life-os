"use client";

import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";

export function AdminLogin() {
  const { pending, error, run } = useAction();
  return (
    <form className="form narrow" onSubmit={(e) => { e.preventDefault(); const body = Object.fromEntries(new FormData(e.currentTarget)); void run(() => callApi("/api/v1/admin/session", "POST", body)); }}>
      <Field label="Access code" name="code" type="password" autoComplete="off" required />
      <FormError message={error} />
      <Button type="submit" disabled={pending}>{pending ? "Checking…" : "Open admin view"}</Button>
    </form>
  );
}

export function AdminTools() {
  const { pending, error, run } = useAction();
  return (
    <div className="toolbar">
      <Button type="button" disabled={pending} onClick={() => run(() => callApi("/api/v1/admin/demo-data", "POST"))}>Load demo households</Button>
      <FormError message={error} />
    </div>
  );
}
