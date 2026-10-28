import { handleApi, success } from "@/lib/utils/api-server";
import { requireUser } from "@/lib/supabase/auth";

export async function GET() {
  return handleApi(async () => {
    const { user } = await requireUser();
    return success({ user: { id: user.id, email: user.email ?? null } });
  });
}
