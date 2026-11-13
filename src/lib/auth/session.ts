import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/types";
import { getRepository } from "@/lib/store";

const USER_COOKIE = "lifeos_session";
const ADMIN_COOKIE = "lifeos_admin";
const USER_MAX_AGE = 60 * 60 * 24 * 90;
const ADMIN_MAX_AGE = 60 * 60 * 4;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("Set SESSION_SECRET in the environment before running in production.");
  return "development-only-secret";
}

const sign = (value: string) => `${value}.${createHmac("sha256", secret()).update(value).digest("base64url")}`;

function unsign(signed: string | undefined): string | null {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i < 0) return null;
  const value = signed.slice(0, i);
  const expected = Buffer.from(sign(value));
  const given = Buffer.from(signed);
  return expected.length === given.length && timingSafeEqual(expected, given) ? value : null;
}

const cookieOptions = (maxAge: number) => ({ httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge });

export async function startUserSession(userId: string) {
  (await cookies()).set(USER_COOKIE, sign(userId), cookieOptions(USER_MAX_AGE));
}

export async function endUserSession() {
  (await cookies()).delete(USER_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const id = unsign((await cookies()).get(USER_COOKIE)?.value);
  return id ? getRepository().getUser(id) : null;
}

/**
 * For household pages: returns the signed-in household. Visitors with no session go to the welcome screen,
 * and installers and administrators go to their own home instead of seeing household screens.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role === "installer") redirect("/installer");
  if (user.role === "admin") redirect("/admin");
  return user;
}

const digest = (s: string) => createHash("sha256").update(s).digest();

export function adminEnabled(): boolean {
  return Boolean(process.env.ADMIN_ACCESS_CODE);
}

export function verifyAdminCode(code: string): boolean {
  const expected = process.env.ADMIN_ACCESS_CODE;
  return Boolean(expected) && timingSafeEqual(digest(code), digest(expected as string));
}

export async function startAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, sign(`admin:${Date.now() + ADMIN_MAX_AGE * 1000}`), cookieOptions(ADMIN_MAX_AGE));
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

/** Server-side admin check. Used by both the admin page and the admin API, never just to hide a link. */
export async function isAdmin(): Promise<boolean> {
  if (!adminEnabled()) return false;
  const value = unsign((await cookies()).get(ADMIN_COOKIE)?.value);
  const expiry = value?.startsWith("admin:") ? Number(value.slice(6)) : 0;
  return expiry > Date.now();
}
