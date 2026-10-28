import { handleApi, success } from "@/lib/utils/api-server";
import { requireUser, throwAuthError } from "@/lib/supabase/auth";
import { assertSameOrigin } from "@/lib/utils/request";

export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const { supabase } = await requireUser();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throwAuthError(error);
    return success({ signedOut: true });
  });
}
