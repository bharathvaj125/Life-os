import { handleApi, success } from "@/lib/utils/api-server";
import { userRpc } from "@/lib/utils/domain-rpc";
import { assertSameOrigin } from "@/lib/utils/request";
import { parseId } from "@/lib/utils/domain-validation";
import type { CompletionResult } from "@/types/domain";

export async function POST(request: Request, context: { params: Promise<{ assignmentId: string }> }) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const { assignmentId } = await context.params;
    return success(await userRpc<CompletionResult>("complete_action", { p_assignment: parseId(assignmentId) }));
  });
}
