"use client";

import Link from "next/link";
import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { VENDOR_SERVICES } from "@/features/vendors/catalog";
import { callApi } from "@/lib/client-api";
import type { VendorService } from "@/types";

/**
 * The form a household uses to ask one registered installer for a quote. The installer sees the first name and the
 * area (first three PIN digits) and whatever is written here, nothing else.
 */
export function QuoteRequestForm({ vendorId, vendorName, services, defaultService, onDone }: { vendorId: string; vendorName: string; services: VendorService[]; defaultService?: VendorService; onDone?: () => void }) {
  const [topic, setTopic] = useState<VendorService>(defaultService && services.includes(defaultService) ? defaultService : services[0]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await callApi<{ id: string }>("/api/v1/quotes", "POST", { vendorId, topic, message });
    setPending(false);
    if (!res.ok) return setError(res.error);
    setSentId(res.data.id);
    onDone?.();
  }

  if (sentId) {
    return (
      <div className="callout" role="status">
        <strong>Request sent to {vendorName}.</strong> Replies will appear on your Quotes page. <Link className="text-link" href={`/quotes/${sentId}`}>Open the conversation →</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="form" noValidate style={{ marginTop: "12px", borderTop: "1px dashed var(--sand-200)", paddingTop: "12px" }}>
      <div className="field">
        <label htmlFor={`topic-${vendorId}`}>What do you need?</label>
        <select id={`topic-${vendorId}`} value={topic} onChange={(e) => setTopic(e.target.value as VendorService)}>
          {VENDOR_SERVICES.filter((s) => services.includes(s.id)).map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`msg-${vendorId}`}>Your message</label>
        <textarea id={`msg-${vendorId}`} rows={4} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="For example: I have a 45 m² terrace and use about 300 units a month. Could you give me a quote and the subsidy steps?" />
        <small>The installer sees your first name, your area (first 3 PIN digits) and this message. Add a phone number only if you want to be called.</small>
      </div>
      <FormError message={error} />
      <Button type="submit" disabled={pending || message.trim().length < 10} className="button-surya">
        <Send size={15} aria-hidden="true" /> {pending ? "Sending…" : "Send request"}
      </Button>
    </form>
  );
}
