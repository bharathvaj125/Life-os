import "server-only";
import { redirect } from "next/navigation";
import type { Role, User } from "@/types";
import { getCurrentUser, isAdmin } from "./session";

export interface Viewer {
  role: Role;
  /** The signed-in account. Null for an administrator who entered the access code and has no account. */
  user: User | null;
  /** True only for the administrator who entered the access code. Demo administrators can look but not change anything. */
  operator: boolean;
}

/** Where each role starts after signing in. */
export const homeFor = (role: Role) => (role === "admin" ? "/admin" : role === "installer" ? "/installer" : "/dashboard");

export async function getViewer(): Promise<Viewer | null> {
  const [user, codeAdmin] = await Promise.all([getCurrentUser(), isAdmin()]);
  if (user) return { role: user.role, user, operator: user.role === "admin" && codeAdmin };
  if (codeAdmin) return { role: "admin", user: null, operator: true };
  return null;
}

/**
 * For pages: the signed-in viewer if their role is allowed. Visitors with no session go to the welcome screen,
 * and people with another role go to their own home, so nobody lands on screens meant for someone else.
 */
export async function requireViewer(...roles: Role[]): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (!roles.includes(viewer.role)) redirect(homeFor(viewer.role));
  return viewer;
}
