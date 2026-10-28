export type ApiErrorCode =
  | "INVALID_INPUT" | "UNAUTHORIZED" | "FORBIDDEN" | "INVALID_CREDENTIALS"
  | "EMAIL_CONFIRMATION_REQUIRED" | "RATE_LIMITED" | "SERVICE_UNAVAILABLE"
  | "PROFILE_REQUIRED" | "PERIOD_OVERLAP" | "BASELINE_ORDER" | "NOT_FOUND" | "ACTION_EXPIRED" | "CHALLENGE_CLOSED"
  | "PAYLOAD_TOO_LARGE" | "UNSUPPORTED_MEDIA_TYPE" | "INTERNAL_ERROR";

export type ApiResponse<T> = { data: T } | { error: { code: ApiErrorCode; message: string; fieldErrors?: Record<string, string> } };
export type AuthUser = { id: string; email: string | null };
export type CredentialsInput = { email: string; password: string };
export type SignUpResult = { user: AuthUser | null; requiresEmailConfirmation: boolean };
export type ProfileInput = {
  displayName: string;
  state: string;
  district: string | null;
  householdSize: number;
  communityOptIn: boolean;
};
export type Profile = ProfileInput & { id: string; createdAt: string; updatedAt: string };
