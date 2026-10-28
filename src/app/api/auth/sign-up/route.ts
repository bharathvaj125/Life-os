import { handleApi, success } from "@/lib/utils/api-server";
import { createClient } from "@/lib/supabase/server";
import { throwAuthError } from "@/lib/supabase/auth";
import { parseCredentials } from "@/lib/utils/validation";
import { assertSameOrigin, readJson } from "@/lib/utils/request";

export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const input = parseCredentials(await readJson(request), "signup");
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp(input);
    if (error) throwAuthError(error, "signup");
    // Confirmation-enabled signup must not disclose whether an address exists.
    return success({ user: data.session && data.user ? { id: data.user.id, email: data.user.email ?? null } : null, requiresEmailConfirmation: !data.session }, 201);
  });
}
