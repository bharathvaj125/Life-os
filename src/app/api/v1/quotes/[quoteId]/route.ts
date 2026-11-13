import { ApiError, handle, parseBody, requireApiUser } from "@/lib/api";
import { quoteStatusSchema } from "@/lib/validation";
import { closeQuote } from "@/services/quotes";

export async function PATCH(request: Request, { params }: { params: Promise<{ quoteId: string }> }) {
  return handle(async () => {
    const user = await requireApiUser();
    if (user.role !== "citizen" && user.role !== "installer") throw new ApiError(403, "Not available for this account.");
    await parseBody(request, quoteStatusSchema);
    return closeQuote(user, (await params).quoteId);
  });
}
