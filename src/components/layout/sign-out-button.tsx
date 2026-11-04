"use client";

import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";

export function SignOutButton() {
  const { pending, run, router } = useAction();
  return <button type="button" className="link-button" disabled={pending} onClick={() => run(() => callApi("/api/v1/session", "DELETE"), () => router.push("/"))}>Sign out</button>;
}
