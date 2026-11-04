export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Browser-side wrapper for the JSON API. Always sends JSON, which the server requires on every write. */
export async function callApi<T = unknown>(path: string, method: "POST" | "PATCH" | "DELETE", body: unknown = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const json = (await res.json().catch(() => ({}))) as { data?: T; error?: string };
    if (!res.ok) return { ok: false, error: json.error ?? "Something went wrong. Please try again." };
    return { ok: true, data: json.data as T };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
}
