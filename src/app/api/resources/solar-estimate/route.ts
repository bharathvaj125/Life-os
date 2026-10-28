import { handleApi, success } from "@/lib/utils/api-server";
import { assertSameOrigin, readJson } from "@/lib/utils/request";
import { parseSolar } from "@/lib/utils/domain-validation";
import { estimateSolar } from "@/lib/calculations/solar";
import { requireUser } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const input = parseSolar(await readJson(request));
    await requireUser();
    return success(estimateSolar(input));
  });
}
