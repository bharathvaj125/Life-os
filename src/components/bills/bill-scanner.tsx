"use client";

import { useRef, useState } from "react";
import { AlertTriangle, BadgeCheck, Camera, CheckCircle2, FileText, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { parseBillText } from "@/lib/bills/parse";
import { readBillFile, type ReadProgress } from "@/lib/bills/read-file";
import { validateBill } from "@/lib/bills/validate";
import { callApi } from "@/lib/client-api";
import type { BillSavingsBonus } from "@/lib/calculations/bill-savings";
import { useAction } from "@/lib/use-action";

type Source = "image" | "pdf";
interface Form {
  consumerNo: string;
  month: string;
  previousReading: string;
  currentReading: string;
  multiplier: string;
  units: string;
  amountInr: string;
}

const num = (s: string) => (s.trim() === "" || !Number.isFinite(Number(s)) ? undefined : Number(s));
const SAMPLES = [
  { file: "/sample-bills/sample-bill-photo.jpg", label: "Sample photo" },
  { file: "/sample-bills/sample-bill-electronic.pdf", label: "Sample PDF e-bill" },
  { file: "/sample-bills/sample-bill-clear.png", label: "Sample scan" },
  { file: "/sample-bills/sample-bill-tampered.png", label: "Edited sample" },
];

/**
 * Scan a bill to fill in a month. The reading happens on this device, so the picture is never uploaded.
 * Every field can be corrected, and the checks run again as you type. The server repeats them before saving.
 */
export function BillScanner() {
  const { pending, error, run, router } = useAction();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<ReadProgress | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [source, setSource] = useState<Source>("image");
  const [notes, setNotes] = useState<string[]>([]);
  const [saved, setSaved] = useState<{ last4: string; bonus: BillSavingsBonus | null; selfReported: boolean } | null>(null);

  const reading = progress !== null;
  const fields = form && { consumerNo: form.consumerNo, month: form.month, previousReading: num(form.previousReading), currentReading: num(form.currentReading), multiplier: num(form.multiplier) ?? 1, units: num(form.units) };
  const check = fields ? validateBill(fields) : null;

  async function process(file: File) {
    setProblem(null);
    setSaved(null);
    setForm(null);
    setProgress({ stage: "loading", fraction: 0, label: "Starting" });
    try {
      const { text, source: kind } = await readBillFile(file, setProgress);
      const bill = parseBillText(text);
      setSource(kind);
      setNotes(bill.notes);
      setForm({
        consumerNo: bill.consumerNo ?? "",
        month: bill.month ?? "",
        previousReading: bill.previousReading?.toString() ?? "",
        currentReading: bill.currentReading?.toString() ?? "",
        multiplier: (bill.multiplier ?? 1).toString(),
        units: bill.units?.toString() ?? "",
        amountInr: bill.amountInr?.toString() ?? "",
      });
      if (bill.units === undefined && !bill.consumerNo) setProblem("We could not find the usual bill details in that picture. Try a clearer, straight-on photo, or fill the fields in below.");
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "We could not read that file. Please try another.");
    } finally {
      setProgress(null);
    }
  }

  async function trySample(url: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      await process(new File([blob], url.split("/").pop() ?? "sample", { type: blob.type }));
    } catch {
      setProblem("Could not load the sample bill.");
    }
  }

  function set(patch: Partial<Form>) {
    setForm((f) => (f ? { ...f, ...patch } : f));
  }

  async function saveScanned() {
    if (!form) return;
    await run(
      () =>
        callApi<{ bonus: BillSavingsBonus | null; proof: { consumerLast4: string } }>("/api/v1/bills", "POST", {
          period: form.month,
          consumerNo: form.consumerNo,
          previousReading: form.previousReading,
          currentReading: form.currentReading,
          multiplier: form.multiplier,
          units: form.units,
          amountInr: form.amountInr,
          source,
        }),
      (data) => {
        setSaved({ last4: data.proof.consumerLast4, bonus: data.bonus, selfReported: false });
        setForm(null);
        router.refresh();
      },
    );
  }

  /** The checks failed, but the household may still want the month recorded. It counts as self-reported, not scanned. */
  async function saveSelfReported() {
    if (!form) return;
    await run(
      () => callApi<{ bonus: BillSavingsBonus | null }>("/api/v1/footprint", "POST", { period: form.month, electricityKwh: form.units, billAmountInr: form.amountInr }),
      (data) => {
        setSaved({ last4: "", bonus: data.bonus, selfReported: true });
        setForm(null);
        router.refresh();
      },
    );
  }

  function reset() {
    setForm(null);
    setSaved(null);
    setProblem(null);
    setNotes([]);
    if (input.current) input.current.value = "";
  }

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <p style={{ margin: 0 }}>
        Take a photo or choose a PDF of your electricity bill. We read it <strong>on your device</strong>, so the picture is never uploaded. A scanned bill earns a badge because its meter readings have to add up to the units.
      </p>

      {!form && !saved ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <input
            ref={input}
            id="bill-file"
            type="file"
            accept="image/*,application/pdf"
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void process(f);
            }}
            disabled={reading}
            aria-label="Choose a photo or PDF of your bill"
          />
          <Button type="button" className="button-surya" disabled={reading} onClick={() => input.current?.click()}>
            <Camera size={17} aria-hidden="true" /> {reading ? "Reading…" : "Photo or PDF of my bill"}
          </Button>
          <span className="muted" style={{ fontSize: "13px" }}>No bill handy? Try</span>
          {SAMPLES.map((s) => (
            <button key={s.file} type="button" className="chip" style={{ cursor: "pointer" }} disabled={reading} onClick={() => trySample(s.file)}>
              <FileText size={12} aria-hidden="true" /> {s.label}
            </button>
          ))}
        </div>
      ) : null}

      {reading ? (
        <div role="status" aria-live="polite">
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", fontWeight: 600, marginBottom: "6px" }}>
            <span>{progress.label}…</span>
            <span>{Math.round(progress.fraction * 100)}%</span>
          </div>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.fraction * 100)} aria-label={progress.label}>
            <div style={{ width: `${Math.round(progress.fraction * 100)}%` }} />
          </div>
        </div>
      ) : null}

      <FormError message={problem} />

      {form && check ? (
        <div style={{ display: "grid", gap: "16px" }}>
          {notes.length ? (
            <div className="callout surya" style={{ margin: 0, fontWeight: 500, display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <Sparkles size={18} aria-hidden="true" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{notes.join(" ")}</span>
            </div>
          ) : null}

          <div className="form" style={{ maxWidth: "none" }}>
            <div className="form-grid">
              <Field label="Consumer number" name="consumerNo" value={form.consumerNo} onChange={(e) => set({ consumerNo: e.target.value })} inputMode="numeric" hint="We keep only the last 4 digits." />
              <Field label="Billing month" name="month" type="month" value={form.month} onChange={(e) => set({ month: e.target.value })} />
            </div>
            <div className="form-grid three">
              <Field label="Previous reading" name="previousReading" type="number" min={0} step="any" value={form.previousReading} onChange={(e) => set({ previousReading: e.target.value })} />
              <Field label="Present reading" name="currentReading" type="number" min={0} step="any" value={form.currentReading} onChange={(e) => set({ currentReading: e.target.value })} />
              <Field label="Multiplying factor" name="multiplier" type="number" min={0} step="any" value={form.multiplier} onChange={(e) => set({ multiplier: e.target.value })} hint="Usually 1." />
            </div>
            <div className="form-grid">
              <Field label="Units billed (kWh)" name="units" type="number" min={0} step="any" value={form.units} onChange={(e) => set({ units: e.target.value })} />
              <Field label="Bill amount (₹, optional)" name="amountInr" type="number" min={0} step="any" value={form.amountInr} onChange={(e) => set({ amountInr: e.target.value })} />
            </div>
          </div>

          {check.status === "scanned" ? (
            <div role="status" className="form-ok" style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <ShieldCheck size={20} aria-hidden="true" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>
                <strong>The readings add up.</strong> {form.currentReading} − {form.previousReading}{num(form.multiplier) !== 1 ? ` × ${form.multiplier}` : ""} = {check.computedUnits} units, matching the {form.units} billed.
              </span>
            </div>
          ) : (
            <div role="alert" className="form-error" style={{ display: "grid", gap: "6px" }}>
              <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <AlertTriangle size={18} aria-hidden="true" /> This does not pass the checks yet
              </span>
              <ul style={{ margin: 0, paddingLeft: "20px", fontWeight: 500 }}>
                {check.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <span style={{ fontWeight: 500, fontSize: "13px" }}>Correct any value that was misread. If the bill really says this, you can still save the month as self-reported.</span>
            </div>
          )}

          <FormError message={error} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            <Button type="button" className="button-surya" disabled={pending || check.status !== "scanned"} onClick={saveScanned}>
              <BadgeCheck size={17} aria-hidden="true" /> {pending ? "Saving…" : "Save as a scanned bill"}
            </Button>
            {check.status !== "scanned" ? (
              <Button type="button" className="button-outline" disabled={pending || !form.month || !num(form.units)} onClick={saveSelfReported}>
                Save as self-reported
              </Button>
            ) : null}
            <button type="button" className="link-button" onClick={reset}>
              <RotateCcw size={13} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> Start over
            </button>
          </div>
        </div>
      ) : null}

      {saved ? (
        <div role="status" className="form-ok" style={{ display: "grid", gap: "8px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={18} aria-hidden="true" />
            {saved.selfReported ? "Month saved as self-reported. It will not carry the scanned-bill badge." : `Bill scanned and saved (consumer number ending ${saved.last4}).`}
          </span>
          {saved.bonus ? (
            <span>
              <strong>Bill savings bonus: +{saved.bonus.points} points.</strong> Your units fell {saved.bonus.reductionPct}% from last month.
            </span>
          ) : null}
          <div>
            <button type="button" className="link-button" onClick={reset}>Scan another bill</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
