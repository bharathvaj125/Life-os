import { endAdminSession, startUserSession } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/viewer";
import { ApiError, clientAddress, handle, parseBody } from "@/lib/api";
import { MAX_REGISTRATIONS, isBlocked, recordFailure } from "@/lib/auth/rate-limit";
import { registerCitizenSchema } from "@/lib/validation";
import { registerCitizen } from "@/services/register";

/** Household registration: account, home profile, equipment and first bill in one step, then signed in. */
export async function POST(request: Request) {
  return handle(async () => {
    const key = `register:${clientAddress(request)}`;
    if (isBlocked(key, MAX_REGISTRATIONS)) throw new ApiError(429, "Too many sign-ups from this connection. Please wait a few minutes and try again.");
    recordFailure(key);
    const user = await registerCitizen(await parseBody(request, registerCitizenSchema));
    await endAdminSession();
    await startUserSession(user.id);
    return { id: user.id, displayName: user.displayName, role: user.role, home: homeFor(user.role) };
  }, 201);
}
