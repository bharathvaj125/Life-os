"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";

export function CompleteTaskButton({ taskId, done, points }: { taskId: string; done: boolean; points: number }) {
  const { pending, error, run } = useAction();
  if (done) return <span className="done-badge"><Check size={16} aria-hidden="true" /> Done</span>;
  return (
    <>
      <Button type="button" disabled={pending} onClick={() => run(() => callApi(`/api/v1/tasks/${taskId}/complete`, "POST"))}>
        {pending ? "Saving…" : `I did this · +${points}`}
      </Button>
      {error ? <p role="alert" className="form-error">{error}</p> : null}
    </>
  );
}
