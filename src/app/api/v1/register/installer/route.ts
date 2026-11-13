import { endAdminSession, startUserSession } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/viewer";
import { ApiError, clientAddress, handle, parseBody } from "@/lib/api";
import { MAX_REGISTRATIONS, isBlocked, recordFailure } from "@/lib/auth/rate-limit";
import { registerInstallerSchema } from "@/lib/validation";
import { registerInstaller } from "@/services/register";

/** Installer registration: account plus a vendor listing that waits for administrator review. */
export async function POST(request: Request) {
  return handle(async () => {
    const key = `register:${clientAddress(request)}`;
    if (isBlocked(key, MAX_REGISTRATIONS)) throw new ApiError(429, "Too many sign-ups from this connection. Please wait a few minutes and try again.");
    recordFailure(key);
    const user = await registerInstaller(await parseBody(request, registerInstallerSchema));
    await endAdminSession();
    await startUserSession(user.id);
    return { id: user.id, displayName: user.displayName, role: user.role, home: homeFor(user.role) };
  }, 201);
}
