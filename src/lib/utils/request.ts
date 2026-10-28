import type { ApiErrorCode } from "../../types/api";

export class RequestError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  constructor(code: ApiErrorCode, message: string, status: number) { super(message); this.code = code; this.status = status; }
}
export function assertSameOrigin(request: Request) {
  // Next.js may reconstruct request.url with localhost behind its server/proxy.
  // Use the incoming Host for authority; browsers cannot forge their Host header.
  // Never trust a caller-supplied JSON origin or x-forwarded-host for this check.
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  if (!origin || origin !== `${url.protocol}//${host}`) throw new RequestError("FORBIDDEN", "A same-origin request is required.", 403);
}
export async function readJson(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new RequestError("UNSUPPORTED_MEDIA_TYPE", "Send application/json.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("INVALID_INPUT", "A JSON body is required.", 400);
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16_384) { await reader.cancel(); throw new RequestError("PAYLOAD_TOO_LARGE", "The request body exceeds 16 KiB.", 413); }
    parts.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new RequestError("INVALID_INPUT", "Send valid JSON.", 400); }
}
