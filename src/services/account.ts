import "server-only";
import type { User } from "@/types";
import { ApiError } from "@/lib/api";
import { decoyHash, hashPassword, verifyPassword } from "@/lib/auth/password";
import { MAX_FAILURES, MAX_IP_FAILURES, clearFailures, isBlocked, recordFailure } from "@/lib/auth/rate-limit";
import { getRepository } from "@/lib/store";
import type { AccountBody, LoginBody } from "@/lib/validation";

const EMAIL_TAKEN = "That email already has an account. Sign in instead.";

/** Gives an existing (so far anonymous) household an email and password so it can sign in from other devices. */
export async function attachAccount(user: User, { email, password }: AccountBody): Promise<void> {
  const repo = getRepository();
  if (user.email) throw new ApiError(409, "This household already has an account.");
  if (await repo.getCredentials(email)) throw new ApiError(409, EMAIL_TAKEN);
  if (!(await repo.setCredentials(user.id, email, await hashPassword(password)))) throw new ApiError(409, EMAIL_TAKEN);
}

/**
 * Checks an email and password. Wrong email and wrong password give the same answer in about the same time,
 * and repeated failures from one address or against one email are blocked for a while.
 */
export async function signIn({ email, password }: LoginBody, clientKey: string): Promise<User> {
  const ipKey = `ip:${clientKey}`;
  const emailKey = `email:${email}`;
  if (isBlocked(ipKey, MAX_IP_FAILURES) || isBlocked(emailKey, MAX_FAILURES)) throw new ApiError(429, "Too many sign-in attempts. Please wait 15 minutes and try again.");

  const repo = getRepository();
  const credentials = await repo.getCredentials(email);
  const matches = await verifyPassword(password, credentials?.passwordHash ?? (await decoyHash()));
  const user = credentials && matches ? await repo.getUser(credentials.userId) : null;
  if (!user) {
    recordFailure(ipKey);
    recordFailure(emailKey);
    throw new ApiError(401, "Email or password is incorrect.");
  }
  clearFailures(emailKey);
  return user;
}
