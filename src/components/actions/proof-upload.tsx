"use client";

import { useRef, useState } from "react";
import { Camera, Check, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { callApi } from "@/lib/client-api";
import { shrinkToJpeg } from "@/lib/image";
import { useAction } from "@/lib/use-action";
import type { TaskProofStatus } from "@/types";

/**
 * The card control for tasks that need a photo. The photo is shrunk in the browser, sent once, and kept only
 * until an administrator has looked at it. Points arrive when it is approved, not when it is sent.
 */
export function ProofUpload({ taskId, points, status, done }: { taskId: string; points: number; status: TaskProofStatus | null; done: boolean }) {
  const { pending, error, run, router } = useAction();
  const input = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (done || status === "approved") {
    return (
      <span className="done-badge" style={{ marginTop: "12px", display: "inline-flex" }}>
        <Check size={16} aria-hidden="true" />
        <span>Photo approved</span>
      </span>
    );
  }
  if (sent || status === "pending") {
    return (
      <p className="chip warn" style={{ marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <Clock size={14} aria-hidden="true" /> Photo sent, waiting for an administrator
      </p>
    );
  }

  async function onPick(file: File | undefined) {
    setLocalError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Please choose a photo.");
      return;
    }
    let image: string;
    try {
      image = await shrinkToJpeg(file);
    } catch {
      setLocalError("That photo could not be read. Try another one.");
      return;
    }
    await run(
      () => callApi(`/api/v1/tasks/${taskId}/proof`, "POST", { image }),
      () => {
        setSent(true);
        router.refresh();
      },
    );
    if (input.current) input.current.value = "";
  }

  return (
    <div style={{ marginTop: "14px" }}>
      {status === "rejected" ? (
        <p className="muted" style={{ margin: "0 0 8px", fontSize: "12.5px", display: "flex", gap: "6px", alignItems: "center" }}>
          <XCircle size={14} aria-hidden="true" /> The last photo was not approved. You can send another.
        </p>
      ) : null}
      <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onPick(e.target.files?.[0])} aria-label="Choose a photo as proof" />
      <Button type="button" disabled={pending} onClick={() => input.current?.click()} className="button-surya" style={{ width: "100%", fontSize: "14px", padding: "10px 16px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Camera size={15} /> {pending ? "Sending…" : `Send a photo for +${points} pts`}
        </span>
      </Button>
      <p className="muted" style={{ margin: "8px 0 0", fontSize: "12.5px" }}>The photo is deleted as soon as it has been reviewed.</p>
      {localError || error ? (
        <p role="alert" className="form-error" style={{ marginTop: "8px", fontSize: "12px" }}>
          {localError ?? error}
        </p>
      ) : null}
    </div>
  );
}
