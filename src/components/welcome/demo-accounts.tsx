"use client";

import { useState } from "react";
import { FormError } from "@/components/ui/field";
import { DEMO_ACCOUNTS, type DemoKey } from "@/features/demo/accounts";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";

/** One-click demo accounts. Each opens a different role, so the app can be explored without registering. */
export function DemoAccounts() {
  const { pending, error, run, router } = useAction();
  const [choice, setChoice] = useState<DemoKey | null>(null);

  async function enter(key: DemoKey) {
    setChoice(key);
    const ok = await run(
      () => callApi<{ home: string }>("/api/v1/session/demo", "POST", { key }),
      (data) => router.push(data.home),
    );
    if (!ok) setChoice(null);
  }

  return (
    <>
      <div className="demo-grid">
        {DEMO_ACCOUNTS.map((a) => (
          <button key={a.key} type="button" className="demo-card" disabled={pending} onClick={() => enter(a.key)} aria-busy={pending && choice === a.key}>
            <span className="demo-avatar" aria-hidden="true">{a.initial}</span>
            <span className="demo-text">
              <strong>{a.title}</strong>
              <span>{pending && choice === a.key ? "Opening…" : a.blurb}</span>
            </span>
          </button>
        ))}
      </div>
      <div style={{ marginTop: "12px" }}>
        <FormError message={error} />
      </div>
    </>
  );
}
