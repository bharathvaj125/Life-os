import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { QuoteList } from "@/components/quotes/quote-list";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { listCitizenQuotes } from "@/services/quotes";

export const metadata: Metadata = { title: "My quote requests" };

export default async function QuotesPage() {
  const user = await requireUser();
  const threads = await listCitizenQuotes(user);
  return (
    <>
      <p className="eyebrow">Quotes</p>
      <h1>My quote requests</h1>
      <p className="intro">Conversations with the installers you asked. They see your first name and area, and the message you wrote. Nothing else about you.</p>
      {threads.length === 0 ? (
        <Card title="No requests yet" icon={<MessageSquare size={20} className="card-icon" style={{ margin: 0 }} />}>
          <p style={{ margin: "0 0 14px" }}>Find an installer on the vendor map and press &ldquo;Request a quote&rdquo;.</p>
          <Link className="button button-surya" href="/vendors">Find an installer</Link>
        </Card>
      ) : (
        <QuoteList threads={threads} base="/quotes" role="citizen" />
      )}
    </>
  );
}
