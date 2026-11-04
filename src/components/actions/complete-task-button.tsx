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
}: {
  taskId: string;
  done: boolean;
  points: number;
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
        disabled={pending}
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
      {error ? (
        <p role="alert" className="form-error" style={{ marginTop: "8px", fontSize: "12px" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
