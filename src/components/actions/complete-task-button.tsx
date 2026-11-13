"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";

export function CompleteTaskButton({
  taskId,
  done,
  points,
  blockedReason = null,
}: {
  taskId: string;
  done: boolean;
  points: number;
  /** Why the task cannot be claimed right now. The server enforces the same rule. */
  blockedReason?: string | null;
}) {
  const { pending, error, run, router } = useAction();
  const [justCompleted, setJustCompleted] = useState(false);

  if (done || justCompleted) {
    return (
      <span className="done-badge" style={{ marginTop: "12px", display: "inline-flex" }}>
        <Check size={16} aria-hidden="true" />
        <span>Completed in this window</span>
      </span>
    );
  }

  async function handleComplete() {
    await run(
      () => callApi(`/api/v1/tasks/${taskId}/complete`, "POST"),
      () => {
        setJustCompleted(true);
        router.refresh();
      }
    );
  }

  return (
    <div style={{ marginTop: "14px" }}>
      <Button
        type="button"
        disabled={pending || Boolean(blockedReason)}
        onClick={handleComplete}
        className="button-surya"
        style={{ width: "100%", fontSize: "14px", padding: "10px 16px" }}
      >
        {pending ? (
          "Verifying…"
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Sparkles size={15} /> Claim +{points} pts
          </span>
        )}
      </Button>
      {blockedReason ? (
        <p className="muted" style={{ margin: "8px 0 0", fontSize: "12.5px" }}>{blockedReason}</p>
      ) : null}
      {error ? (
        <p role="alert" className="form-error" style={{ marginTop: "8px", fontSize: "12px" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
