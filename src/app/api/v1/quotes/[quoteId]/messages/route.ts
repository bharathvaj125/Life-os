import { handle, parseBody, requireApiUser } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { quoteMessageSchema } from "@/lib/validation";
import { postMessage } from "@/services/quotes";

export async function POST(request: Request, { params }: { params: Promise<{ quoteId: string }> }) {
  return handle(async () => {
    const user = await requireApiUser();
    if (user.role !== "citizen" && user.role !== "installer") throw new ApiError(403, "Not available for this account.");
    const { body } = await parseBody(request, quoteMessageSchema);
    return postMessage(user, (await params).quoteId, body);
  }, 201);
}
