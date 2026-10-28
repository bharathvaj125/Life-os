import { InputError } from "./validation.ts";
import type { FootprintInput, SolarInput } from "../../types/domain";

export function indiaDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
function object(value: unknown, fields: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError({ body: "Expected a JSON object." });
  const input = value as Record<string, unknown>;
  const extra = Object.keys(input).filter(key => !fields.includes(key));
  if (extra.length) throw new InputError(Object.fromEntries(extra.map(key => [key, "Unknown field."])));
  return input;
}
export function parseDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "2000-01-01") throw new InputError({ period: "Use a date from 2000 onward in YYYY-MM-DD format." });
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new InputError({ period: "Use a real calendar date." });
  return value;
}
export function parseFootprint(value: unknown, today = indiaDate()): FootprintInput {
  const input = object(value, ["periodStart", "periodEnd", "electricityKwh"]);
  const periodStart = parseDate(input.periodStart);
  const periodEnd = parseDate(input.periodEnd);
  const days = (Date.parse(periodEnd) - Date.parse(periodStart)) / 86_400_000 + 1;
  if (days < 1 || days > 366 || periodEnd > today) throw new InputError({ period: "Use an ordered, completed period of 1–366 days, with no future dates." });
  const electricityKwh = finiteNumber(input.electricityKwh, 0, 100_000, "electricityKwh");
  return { periodStart, periodEnd, electricityKwh };
}
function finiteNumber(value: unknown, min: number, max: number, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new InputError({ [name]: `Use a finite number from ${min} to ${max}.` });
  return value;
}
export function parseSolar(value: unknown): SolarInput {
  const input = object(value, ["roofAreaM2", "monthlyElectricityKwh"]);
  return { roofAreaM2: finiteNumber(input.roofAreaM2, 1, 10_000, "roofAreaM2"), monthlyElectricityKwh: finiteNumber(input.monthlyElectricityKwh, 0, 100_000, "monthlyElectricityKwh") };
}
export function parseLimit(value: string | null, fallback = 20): number {
  if (value === null) return fallback;
  if (!/^[1-9]\d{0,2}$/.test(value) || Number(value) > 100) throw new InputError({ limit: "Use an integer from 1 to 100." });
  return Number(value);
}
export function parseId(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new InputError({ id: "Use a valid identifier." });
  return value;
}
export function parseCursor(value: string | null): { date: string; id: string } | null {
  if (!value) return null;
  const parts = value.split("~");
  if (parts.length !== 2) throw new InputError({ cursor: "Invalid history cursor." });
  return { date: parseDate(parts[0]), id: parseId(parts[1]) };
}
