import { adminEnabled, endAdminSession, startAdminSession, verifyAdminCode } from "@/lib/auth/session";
import { ApiError, handle, parseBody } from "@/lib/api";
import { adminLoginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  return handle(async () => {
    const { code } = await parseBody(request, adminLoginSchema);
    if (!adminEnabled()) throw new ApiError(503, "Administrator access is not configured on this deployment.");
    if (!verifyAdminCode(code)) throw new ApiError(401, "That access code is not correct.");
    await startAdminSession();
    return { admin: true };
  });
}

export async function DELETE() {
  return handle(async () => {
    await endAdminSession();
    return { admin: false };
  });
}
