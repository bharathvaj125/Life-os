import { handleApi, success } from "@/lib/utils/api-server";
import { createClient } from "@/lib/supabase/server";
import { throwAuthError } from "@/lib/supabase/auth";
import { parseCredentials } from "@/lib/utils/validation";
import { assertSameOrigin, readJson, RequestError } from "@/lib/utils/request";

export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const input = parseCredentials(await readJson(request), "signin");
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(input);
    if (error) throwAuthError(error, "signin");
    if (!data.user) throw new RequestError("UNAUTHORIZED", "Sign in to continue.", 401);
    return success({ user: { id: data.user.id, email: data.user.email ?? null } });
  });
}
