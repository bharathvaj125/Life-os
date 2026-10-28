import { apiRequest } from "@/lib/utils/api-client";
import type { SolarInput, SolarEstimate, Resource } from "@/types/domain";

export function estimateRooftopSolar(input: SolarInput) { return apiRequest<SolarEstimate>("/api/resources/solar-estimate", { method: "POST", body: JSON.stringify(input) }); }
export function getResources(category?: Resource["category"]) { return apiRequest<{ resources: Resource[] }>(`/api/resources${category ? `?category=${encodeURIComponent(category)}` : ""}`); }
