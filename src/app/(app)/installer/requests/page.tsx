import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { QuoteList } from "@/components/quotes/quote-list";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/field";
import { requireViewer } from "@/lib/auth/viewer";
import { getListing } from "@/services/installer";
import { listInstallerQuotes } from "@/services/quotes";

export const metadata: Metadata = { title: "Installer: requests" };

export default async function InstallerRequestsPage() {
  const { user } = await requireViewer("installer");
  if (!user) return null;
  const [threads, listing] = await Promise.all([listInstallerQuotes(user), getListing(user)]);
  const waiting = threads.filter((t) => t.waitingOnYou).length;
  const open = threads.filter((t) => t.request.status === "open").length;
  return (
    <>
      <p className="eyebrow">Installer · Requests</p>
      <h1>Quote requests from households</h1>
      <p className="intro">Households ask you for help from the vendor map. You see their first name, their area and what they wrote, and you reply here.</p>
      <section className="stats" aria-label="Request totals">
        <Stat label="Waiting for your reply" value={waiting} tone={waiting ? "warn" : undefined} note="The household wrote last" />
        <Stat label="Open conversations" value={open} note="Not yet closed" />
        <Stat label="All requests" value={threads.length} note="Since you listed" />
      </section>
      {threads.length === 0 ? (
        <Card title="No requests yet" icon={<Inbox size={20} className="card-icon" style={{ margin: 0 }} />}>
          <p style={{ margin: 0 }}>{listing?.status === "approved" ? "Households can now find your listing and send you a request." : "Requests can arrive only once an administrator has approved your listing."}</p>
        </Card>
      ) : (
        <QuoteList threads={threads} base="/installer/requests" role="installer" />
      )}
    </>
  );
}
