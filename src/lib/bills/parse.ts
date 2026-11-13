/**
 * Reads the useful fields out of the text of an electricity bill. The text comes from OCR on the user's own
 * device, so it is noisy: a colon is often read as a "1", digits get glued together, labels differ between
 * distribution companies. Rather than trust one reading of each number, the parser keeps a short list of
 * candidates per field and picks the combination where the meter readings add up to the billed units.
 */

export interface BillFields {
  consumerNo?: string;
  /** Billing month as YYYY-MM. */
  month?: string;
  previousReading?: number;
  currentReading?: number;
  multiplier?: number;
  units?: number;
  amountInr?: number;
}

export interface ParsedBill extends BillFields {
  /** Plain-language remarks about guesses the parser made, shown beside the extracted values. */
  notes: string[];
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Number-like tokens in a piece of text, with thousands commas removed. */
function numberTokens(text: string): string[] {
  return (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((t) => t.replace(/,/g, ""));
}

/** Text after the first label match on a line, or null when the label is not there. */
function afterLabel(line: string, label: RegExp): string | null {
  const m = label.exec(line);
  return m ? line.slice(m.index + m[0].length) : null;
}

/**
 * Candidate values for a number printed after a label. The last number on the line comes first, because the
 * value sits at the end. For a token that starts with "1" we also offer the token without it, since a colon
 * that OCR reads as "1" gets glued to the front of the value.
 */
function candidates(lines: string[], label: RegExp, opts: { decimals?: boolean } = {}): number[] {
  const out: number[] = [];
  const push = (s: string) => {
    const n = Number(s);
    if (Number.isFinite(n) && n >= 0 && !out.includes(n)) out.push(n);
  };
  for (const line of lines) {
    const rest = afterLabel(line, label);
    if (rest === null) continue;
    const tokens = numberTokens(rest).filter((t) => opts.decimals || !t.includes("."));
    for (const t of [...tokens].reverse()) push(t);
    for (const t of [...tokens].reverse()) if (t.length >= 2 && t.startsWith("1") && !t.includes(".")) push(t.slice(1));
  }
  return out;
}

const LABELS = {
  consumer: /(consumer|service|connection|account|customer)\s*(no|number|id|#)\.?|\bk\s*no\b|con\.?\s*no\b/i,
  previous: /(previous|prev\.?|last|opening|old)\s*(meter\s*)?(reading|rdg)|pre\.?\s*rdg/i,
  current: /(present|current|new|closing|pres\.?)\s*(meter\s*)?(reading|rdg)/i,
  units: /(units?\s*(consumed|billed)|consumption|net\s*units|total\s*units|billed\s*units|kwh\s*consumed|energy\s*consumed)/i,
  multiplier: /(multiplying|multiplication|multiplier|mult\.?)\s*factor|\bmf\b/i,
  amount: /((total\s*)?amount\s*(payable|due)|net\s*(amount|payable)|bill\s*amount|total\s*bill|payable\s*amount)/i,
  month: /(bill(ing)?\s*(month|for)|for\s*the\s*month|month\s*of|bill\s*period|\bmonth\b)/i,
};

/** Billing month from free text: "SEP-2026", "September 2026", "09/2026", "2026-09" or a date like "30-09-2026". */
export function monthFromText(text: string): string | undefined {
  const year = (s: string) => (s.length === 2 ? 2000 + Number(s) : Number(s));
  const named = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,.\-/']*(\d{4}|\d{2})\b/i.exec(text);
  if (named) return `${year(named[2])}-${pad(MONTHS.indexOf(named[1].toLowerCase()) + 1)}`;
  const isoLike = /\b(20\d{2})[\/\-.](0?[1-9]|1[0-2])\b/.exec(text);
  if (isoLike) return `${isoLike[1]}-${pad(Number(isoLike[2]))}`;
  const monthFirst = /\b(0?[1-9]|1[0-2])[\/\-.](20\d{2})\b/.exec(text);
  if (monthFirst) return `${monthFirst[2]}-${pad(Number(monthFirst[1]))}`;
  const date = /\b(0?[1-9]|[12]\d|3[01])[\/\-.](0?[1-9]|1[0-2])[\/\-.](20\d{2})\b/.exec(text);
  if (date) return `${date[3]}-${pad(Number(date[2]))}`;
  return undefined;
}

function findMonth(lines: string[], text: string): string | undefined {
  for (const line of lines) {
    const rest = afterLabel(line, LABELS.month);
    if (rest !== null) {
      const m = monthFromText(rest);
      if (m) return m;
    }
  }
  // Without a labelled month, use the end of the billing period if one is printed, or any month-year in the text.
  const period = /(\d{1,2}[\/\-.]\d{1,2}[\/\-.]20\d{2})\s*(to|-|–)\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]20\d{2})/i.exec(text);
  if (period) return monthFromText(period[3]);
  return monthFromText(text);
}

/** Digits of the consumer number: 8 to 13 digits, ignoring slashes, dashes and spaces between groups. */
function findConsumer(lines: string[]): string | undefined {
  const found: string[] = [];
  for (const line of lines) {
    const rest = afterLabel(line, LABELS.consumer);
    if (rest === null) continue;
    for (const group of rest.match(/\d[\d\s/\-]{6,}\d/g) ?? []) found.push(group.replace(/\D/g, ""));
    for (const t of rest.match(/\d+/g) ?? []) found.push(t);
  }
  const valid = found.filter((d) => d.length >= 8 && d.length <= 13);
  return valid.sort((a, b) => b.length - a.length)[0];
}

/** True when present minus previous reading, times the multiplier, equals the billed units (within rounding). */
const addsUp = (units: number, prev: number, curr: number, mf: number) => curr >= prev && Math.abs((curr - prev) * mf - units) <= 1;

export function parseBillText(text: string): ParsedBill {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const notes: string[] = [];

  const prev = candidates(lines, LABELS.previous);
  const curr = candidates(lines, LABELS.current);
  const units = candidates(lines, LABELS.units);
  const mf = candidates(lines, LABELS.multiplier);
  const multipliers = mf.length ? [...new Set([...mf, 1])] : [1];

  const result: ParsedBill = { notes };
  result.consumerNo = findConsumer(lines);
  result.month = findMonth(lines, text);

  // Prefer the combination that adds up, and among those the one that uses the least "stripped" guesses.
  let best: { p: number; c: number; u: number; m: number; cost: number } | null = null;
  for (let ui = 0; ui < Math.max(units.length, 1); ui++) {
    for (let pi = 0; pi < Math.max(prev.length, 1); pi++) {
      for (let ci = 0; ci < Math.max(curr.length, 1); ci++) {
        for (let mi = 0; mi < multipliers.length; mi++) {
          const u = units[ui], p = prev[pi], c = curr[ci], m = multipliers[mi];
          if (u === undefined || p === undefined || c === undefined) continue;
          if (!addsUp(u, p, c, m)) continue;
          const cost = ui + pi + ci + mi;
          if (!best || cost < best.cost) best = { p, c, u, m, cost };
        }
      }
    }
  }

  if (best) {
    Object.assign(result, { previousReading: best.p, currentReading: best.c, units: best.u, multiplier: best.m });
    if (best.cost > 0) notes.push("A few characters on the bill were hard to read, so we picked the values that add up. Please check them.");
  } else {
    result.previousReading = prev[0];
    result.currentReading = curr[0];
    result.units = units[0];
    result.multiplier = mf[0];
    if (result.units === undefined && result.previousReading !== undefined && result.currentReading !== undefined && result.currentReading >= result.previousReading) {
      result.units = Math.round((result.currentReading - result.previousReading) * (result.multiplier ?? 1) * 100) / 100;
      notes.push("The units were worked out from the two meter readings because they were not found on the bill.");
    }
  }

  const amounts = candidates(lines, LABELS.amount, { decimals: true });
  if (amounts.length) result.amountInr = amounts[0];
  return result;
}
