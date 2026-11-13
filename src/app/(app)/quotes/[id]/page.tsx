import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import { QuoteThread } from "@/components/quotes/thread";
import { Card } from "@/components/ui/card";
import { serviceLabel } from "@/features/vendors/catalog";
import { ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { getThread } from "@/services/quotes";

export const metadata: Metadata = { title: "Quote conversation" };

export default async function QuoteThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const t = await getThread(user, id).catch((e) => {
    if (e instanceof ApiError) return null;
    throw e;
  });
  if (!t) notFound();
  return (
    <>
      <Link className="text-link" href="/quotes"><ArrowLeft size={14} aria-hidden="true" /> All requests</Link>
      <h1 style={{ marginTop: "10px" }}>{t.vendor.name}</h1>
      <div className="badge-row" style={{ marginBottom: "18px" }}>
        <span className="chip">{serviceLabel(t.request.topic)}</span>
        <span className="chip"><MapPin size={12} aria-hidden="true" /> {t.vendor.city} · {t.vendor.pincode}</span>
        {t.vendor.verifiedOn ? <span className="chip">Checked on an official list · {t.vendor.verifiedOn}</span> : null}
        {t.vendor.website ? <a className="chip" href={t.vendor.website} target="_blank" rel="noopener noreferrer nofollow">Website <ExternalLink size={12} aria-hidden="true" /></a> : null}
      </div>
      <Card title="Conversation">
        <QuoteThread requestId={t.request.id} status={t.request.status} viewerRole="citizen" otherName={t.vendor.name} messages={t.messages.map((m) => ({ id: m.id, authorRole: m.authorRole, body: m.body, at: m.createdAt }))} />
      </Card>
      <p className="muted" style={{ fontSize: "13px" }}>Before you pay anyone, check them on the official lists. Never pay the full amount upfront, because the central subsidy is paid to you after inspection.</p>
    </>
  );
}
