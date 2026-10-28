import "server-only";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "./server";
import { RequestError } from "@/lib/utils/request";

export function throwAuthError(error: AuthError, fallback: "signin" | "signup" | "session" = "session"): never {
  if (error.status === 429) throw new RequestError("RATE_LIMITED", "Too many attempts. Please try again later.", 429);
  if (!error.status || error.status >= 500) throw new RequestError("SERVICE_UNAVAILABLE", "Authentication is temporarily unavailable.", 503);
  if (error.code === "email_not_confirmed") throw new RequestError("EMAIL_CONFIRMATION_REQUIRED", "Confirm your email before signing in.", 403);
  if (fallback === "signin") throw new RequestError("INVALID_CREDENTIALS", "Unable to sign in with those credentials.", 401);
  if (fallback === "signup") throw new RequestError("INVALID_INPUT", "Unable to create an account. Check the credentials and try again.", 400);
  throw new RequestError("UNAUTHORIZED", "Sign in to continue.", 401);
}
export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throwAuthError(error);
  if (!data.user) throw new RequestError("UNAUTHORIZED", "Sign in to continue.", 401);
  return { supabase, user: data.user };
}
