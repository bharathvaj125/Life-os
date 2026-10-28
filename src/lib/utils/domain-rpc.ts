import "server-only";
import { requireUser } from "@/lib/supabase/auth";
import { RequestError } from "./request";

const knownErrors = {
  PROFILE_REQUIRED: [409, "Complete your profile before using this feature."],
  PERIOD_OVERLAP: [409, "This period overlaps a saved measurement."],
  BASELINE_ORDER: [409, "Add later periods after your original baseline."],
  NOT_FOUND: [404, "This item is not available."],
  ACTION_EXPIRED: [409, "This task is no longer available for completion today."],
  CHALLENGE_CLOSED: [409, "This challenge is not accepting participation."],
  UNAUTHORIZED: [401, "Sign in to continue."],
  INVALID_INPUT: [400, "The supplied values are invalid."],
} as const;
export async function userRpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    const mapped = Object.hasOwn(knownErrors, error.message) ? knownErrors[error.message as keyof typeof knownErrors] : undefined;
    if (mapped) throw new RequestError(error.message as keyof typeof knownErrors, mapped[1], mapped[0]);
    throw new RequestError("SERVICE_UNAVAILABLE", "Data storage is temporarily unavailable.", 503);
  }
  return data as T;
}
