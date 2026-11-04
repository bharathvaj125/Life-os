const IST = "Asia/Kolkata";

/** Calendar date (YYYY-MM-DD) in India Standard Time. */
export function istDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function istHour(d: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: IST, hour: "2-digit", hour12: false }).format(d)) % 24;
}

export function istPeriod(d: Date = new Date()): string {
  return istDate(d).slice(0, 7);
}

export function addDays(date: string, n: number): string {
  const t = new Date(`${date}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

/** Shift a YYYY-MM period by a number of months. */
export function shiftPeriod(period: string, months: number): string {
  const [y, m] = period.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + months, 1));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isoWeekKey(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const week = Math.ceil(((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function formatPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
}
