import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { throwAuthError } from "@/lib/supabase/auth";
import { handleApi } from "@/lib/utils/api-server";
import { RequestError } from "@/lib/utils/request";

// Supabase confirmation email links point here with a single-use token hash.
// Fixed redirect destination: never trust an arbitrary next/redirect URL.
export async function GET(request: Request) {
  return handleApi(async () => {
    const url = new URL(request.url);
    const tokenHash = url.searchParams.get("token_hash");
    if (!tokenHash || !/^[a-zA-Z0-9_-]{1,2048}$/.test(tokenHash) || url.searchParams.get("type") !== "email") {
      throw new RequestError("INVALID_INPUT", "This confirmation link is invalid.", 400);
    }
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    if (error) throwAuthError(error);
    const response = NextResponse.redirect(new URL("/", url.origin), 303);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  });
}
