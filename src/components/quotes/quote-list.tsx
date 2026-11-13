import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { serviceLabel } from "@/features/vendors/catalog";
import type { ThreadView } from "@/services/quotes";

/** One card per conversation, newest activity first. `base` is where the conversation pages live. */
export function QuoteList({ threads, base, role }: { threads: ThreadView[]; base: string; role: "citizen" | "installer" }) {
  return (
    <div style={{ display: "grid", gap: "14px" }}>
      {threads.map((t) => {
        const last = t.messages[t.messages.length - 1];
        return (
          <Link key={t.request.id} href={`${base}/${t.request.id}`} className="card quote-card">
            <div className="quote-card-head">
              <div>
                <h2>{role === "citizen" ? t.vendor.name : `${t.citizenFirstName} · area ${t.citizenArea}`}</h2>
                <div className="badge-row">
                  <span className="chip">{serviceLabel(t.request.topic)}</span>
                  <span className={`chip ${t.request.status === "closed" ? "" : "surya"}`}>{t.request.status === "closed" ? "Closed" : "Open"}</span>
                  {t.waitingOnYou ? <span className="chip warn">Waiting for your reply</span> : null}
                </div>
              </div>
              <ChevronRight size={20} aria-hidden="true" />
            </div>
            {last ? <p className="muted" style={{ margin: "10px 0 0" }}>{last.authorRole === role ? "You: " : ""}{last.body.length > 140 ? `${last.body.slice(0, 140)}…` : last.body}</p> : null}
          </Link>
        );
      })}
    </div>
  );
}
