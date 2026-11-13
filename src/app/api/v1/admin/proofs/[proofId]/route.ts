import { handle, parseBody, requireApiAdmin } from "@/lib/api";
import { proofReviewSchema } from "@/lib/validation";
import { reviewProof } from "@/services/proofs";

export async function PATCH(request: Request, { params }: { params: Promise<{ proofId: string }> }) {
  return handle(async () => {
    await requireApiAdmin();
    const { decision } = await parseBody(request, proofReviewSchema);
    return reviewProof((await params).proofId, decision);
  });
}
