import { apiRequest } from "@/lib/utils/api-client";
import type { FootprintInput, FootprintEntry, FootprintHistory } from "@/types/domain";

export function saveFootprint(input: FootprintInput) { return apiRequest<FootprintEntry>("/api/footprint/entries", { method: "POST", body: JSON.stringify(input) }); }
export function getFootprintHistory(options: { limit?: number; cursor?: string } = {}) {
  const query = new URLSearchParams();
  if (options.limit !== undefined) query.set("limit", String(options.limit));
  if (options.cursor) query.set("cursor", options.cursor);
  return apiRequest<FootprintHistory>(`/api/footprint/entries?${query}`);
}
