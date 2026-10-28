import { handleApi, success } from "@/lib/utils/api-server";
import { userRpc } from "@/lib/utils/domain-rpc";
import { assertSameOrigin } from "@/lib/utils/request";
import { parseId } from "@/lib/utils/domain-validation";

export async function POST(request: Request, context: { params: Promise<{ challengeId: string }> }) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const { challengeId } = await context.params;
    return success(await userRpc<{ challengeId: string; joined: true }>("join_challenge", { p_challenge: parseId(challengeId) }));
  });
}
