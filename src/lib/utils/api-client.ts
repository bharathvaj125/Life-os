import type { ApiResponse, ApiErrorCode } from "@/types/api";

export class ApiClientError extends Error {
  constructor(public readonly code: ApiErrorCode, message: string, public readonly status: number, public readonly fieldErrors?: Record<string, string>) { super(message); }
}
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(path, {
    ...init, credentials: "same-origin", cache: "no-store",
    headers,
  });
  const body = await response.json() as ApiResponse<T>;
  if ("error" in body) throw new ApiClientError(body.error.code, body.error.message, response.status, body.error.fieldErrors);
  if (!response.ok) throw new ApiClientError("INTERNAL_ERROR", "The request could not be completed.", response.status);
  return body.data;
}
