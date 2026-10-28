import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig, SupabaseConfigError } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  // Public placeholders continue to work before a Supabase project is configured.
  let config;
  try { config = getSupabaseConfig(); }
  catch (error) { if (error instanceof SupabaseConfigError) return NextResponse.next(); throw error; }
  if (!request.cookies.getAll().some(cookie => cookie.name.startsWith("sb-"))) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // getUser validates the token with Supabase. Never use getSession as an
  // authorization decision. API handlers independently validate identity.
  try { await supabase.auth.getUser(); }
  catch { /* Let public pages render during outages; private APIs fail closed. */ }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
