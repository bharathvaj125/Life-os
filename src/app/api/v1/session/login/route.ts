import { endAdminSession, startUserSession } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/viewer";
import { handle, parseBody } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { signIn } from "@/services/account";

/** Sign in with email and password. Sets the same signed session cookie that onboarding does. */
export async function POST(request: Request) {
  return handle(async () => {
    const body = await parseBody(request, loginSchema);
    const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const user = await signIn(body, clientKey);
    await endAdminSession();
    await startUserSession(user.id);
    return { id: user.id, displayName: user.displayName, role: user.role, home: homeFor(user.role) };
  });
}
