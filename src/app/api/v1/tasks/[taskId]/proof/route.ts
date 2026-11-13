import { handle, parseBody, requireApiCitizen } from "@/lib/api";
import { proofSchema } from "@/lib/validation";
import { submitTaskProof } from "@/services/proofs";

export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  return handle(async () => {
    const user = await requireApiCitizen();
    const { image } = await parseBody(request, proofSchema);
    return submitTaskProof(user, (await params).taskId, image);
  }, 201);
}
