"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { callApi } from "@/lib/client-api";
import { useAction } from "@/lib/use-action";

export interface ThreadMessage {
  id: string;
  authorRole: "citizen" | "installer";
  body: string;
  at: string;
}

/** The messages of one conversation and the box to reply. Either side can close it when the matter is settled. */
export function QuoteThread({ requestId, status, messages, viewerRole, otherName }: { requestId: string; status: "open" | "closed"; messages: ThreadMessage[]; viewerRole: "citizen" | "installer"; otherName: string }) {
  const { pending, error, run } = useAction();
  const [body, setBody] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => callApi(`/api/v1/quotes/${requestId}/messages`, "POST", { body }));
    if (ok) setBody("");
  }

  return (
    <div className="thread">
      <ol className="thread-list" aria-label="Messages">
        {messages.map((m) => {
          const mine = m.authorRole === viewerRole;
          return (
            <li key={m.id} className={`bubble ${mine ? "mine" : "theirs"}`}>
              <span className="bubble-who">{mine ? "You" : otherName}</span>
              <p>{m.body}</p>
              <time dateTime={m.at}>{new Date(m.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</time>
            </li>
          );
        })}
      </ol>

      {status === "open" ? (
        <form onSubmit={send} className="form" noValidate>
          <div className="field">
            <label htmlFor="reply">Reply</label>
            <textarea id="reply" rows={3} maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} placeholder={viewerRole === "installer" ? "Share a quote, ask for details, or suggest a site visit." : "Ask a question or answer the installer."} />
          </div>
          <FormError message={error} />
          <div className="toolbar">
            <Button type="submit" disabled={pending || body.trim().length === 0} className="button-surya">
              <Send size={15} aria-hidden="true" /> {pending ? "Sending…" : "Send"}
            </Button>
            <Button type="button" disabled={pending} onClick={() => run(() => callApi(`/api/v1/quotes/${requestId}`, "PATCH", { status: "closed" }))}>
              <CheckCircle2 size={15} aria-hidden="true" /> Close conversation
            </Button>
          </div>
        </form>
      ) : (
        <p className="muted">This conversation is closed.</p>
      )}
    </div>
  );
}
