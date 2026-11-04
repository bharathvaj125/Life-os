import { endUserSession, startUserSession } from "@/lib/auth/session";
import { handle, parseBody } from "@/lib/api";
import { onboardingSchema } from "@/lib/validation";
import { onboard } from "@/services/profile";

/** Onboarding: creates the household, its baseline footprint and a signed session cookie. */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await onboard(await parseBody(request, onboardingSchema));
    await startUserSession(user.id);
    return { id: user.id, displayName: user.displayName };
  }, 201);
}

export async function DELETE() {
  return handle(async () => {
    await endUserSession();
    return { signedOut: true };
  });
}
