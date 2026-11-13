import { endAdminSession, startUserSession } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/viewer";
import { handle, parseBody } from "@/lib/api";
import { demoLoginSchema } from "@/lib/validation";
import { ensureDemoAccount } from "@/services/demo";

/** One-click entry to a shared demo account. No password: these are sandboxes, labelled "(demo)" everywhere. */
export async function POST(request: Request) {
  return handle(async () => {
    const { key } = await parseBody(request, demoLoginSchema);
    const user = await ensureDemoAccount(key);
    await endAdminSession();
    await startUserSession(user.id);
    return { id: user.id, displayName: user.displayName, role: user.role, home: homeFor(user.role) };
  });
}
