import { apiRequest } from "@/lib/utils/api-client";
import type { DailyAction, CompletionResult } from "@/types/domain";

export function getTodayActions() { return apiRequest<{ actions: DailyAction[] }>("/api/actions/today"); }
export function completeAction(assignmentId: string) { return apiRequest<CompletionResult>(`/api/actions/${encodeURIComponent(assignmentId)}/complete`, { method: "POST" }); }
