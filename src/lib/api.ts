import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getCurrentUser, isAdmin } from "@/lib/auth/session";
import type { User } from "@/types";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Runs a handler and turns thrown errors into consistent JSON: { data } on success, { error } on failure. */
export async function handle(fn: () => Promise<unknown>, status = 200): Promise<NextResponse> {
  try {
    return NextResponse.json({ data: await fn() }, { status });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof ZodError) return NextResponse.json({ error: e.issues.map((i) => i.message).join(". ") }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

/** JSON-only bodies: a cross-site HTML form cannot send application/json, which blocks CSRF on top of SameSite cookies. */
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new ApiError(415, "Send JSON with a content-type of application/json.");
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "The request body is not valid JSON.");
  }
  return schema.parse(raw);
}

export async function requireApiUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Please start from the onboarding page first.");
  return user;
}

export async function requireApiAdmin() {
  if (!(await isAdmin())) throw new ApiError(403, "Administrator access is required.");
}
