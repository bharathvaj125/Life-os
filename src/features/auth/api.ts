import { apiRequest } from "@/lib/utils/api-client";
import type { AuthUser, CredentialsInput, SignUpResult } from "@/types/api";

export function signUp(input: CredentialsInput) { return apiRequest<SignUpResult>("/api/auth/sign-up", { method: "POST", body: JSON.stringify(input) }); }
export function signIn(input: CredentialsInput) { return apiRequest<{ user: AuthUser }>("/api/auth/sign-in", { method: "POST", body: JSON.stringify(input) }); }
export function signOut() { return apiRequest<{ signedOut: true }>("/api/auth/sign-out", { method: "POST" }); }
export function getCurrentUser() { return apiRequest<{ user: AuthUser }>("/api/auth/me"); }
