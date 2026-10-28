import "server-only";
import { NextResponse } from "next/server";
import { InputError } from "./validation";
import { RequestError } from "./request";
import { SupabaseConfigError } from "@/lib/supabase/config";
import type { ApiResponse } from "@/types/api";

export function success<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ data }, { status, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}
export async function handleApi(work: () => Promise<Response>) {
  try { return await work(); }
  catch (error) {
    let status = 500;
    let body: ApiResponse<never> = { error: { code: "INTERNAL_ERROR", message: "The request could not be completed." } };
    if (error instanceof InputError) { status = 400; body = { error: { code: "INVALID_INPUT", message: error.message, fieldErrors: error.fieldErrors } }; }
    else if (error instanceof RequestError) { status = error.status; body = { error: { code: error.code, message: error.message } }; }
    else if (error instanceof SupabaseConfigError) { status = 503; body = { error: { code: "SERVICE_UNAVAILABLE", message: "Authentication is not configured yet." } }; }
    // Never return provider errors, SQL details, input credentials, or tokens.
    return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  }
}
