import { apiRequest } from "@/lib/utils/api-client";
import type { Profile, ProfileInput } from "@/types/api";

export function getProfile() { return apiRequest<{ profile: Profile | null }>("/api/profile"); }
export function saveProfile(input: ProfileInput) { return apiRequest<{ profile: Profile }>("/api/profile", { method: "PUT", body: JSON.stringify(input) }); }
