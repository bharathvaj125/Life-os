import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { QuoteThread } from "@/components/quotes/thread";
import { Card } from "@/components/ui/card";
import { serviceLabel } from "@/features/vendors/catalog";
import { ApiError } from "@/lib/api";
import { requireViewer } from "@/lib/auth/viewer";
import { getThread } from "@/services/quotes";

export const metadata: Metadata = { title: "Installer: conversation" };

export default async function InstallerThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireViewer("installer");
  if (!user) return null;
  const { id } = await params;
  const t = await getThread(user, id).catch((e) => {
    if (e instanceof ApiError) return null;
    throw e;
  });
  if (!t) notFound();
  return (
    <>
      <Link className="text-link" href="/installer/requests"><ArrowLeft size={14} aria-hidden="true" /> All requests</Link>
      <h1 style={{ marginTop: "10px" }}>{t.citizenFirstName}</h1>
      <div className="badge-row" style={{ marginBottom: "18px" }}>
        <span className="chip">{serviceLabel(t.request.topic)}</span>
        <span className="chip"><MapPin size={12} aria-hidden="true" /> Area {t.citizenArea}xxx</span>
        <span className="chip">For {t.vendor.name}</span>
      </div>
      <Card title="Conversation">
        <QuoteThread requestId={t.request.id} status={t.request.status} viewerRole="installer" otherName={t.citizenFirstName} messages={t.messages.map((m) => ({ id: m.id, authorRole: m.authorRole, body: m.body, at: m.createdAt }))} />
      </Card>
      <p className="muted" style={{ fontSize: "13px" }}>You only see this household&apos;s first name and area. Do not ask for payment before an inspection, and quote your registration ID so they can check you on the official list.</p>
    </>
  );
}
