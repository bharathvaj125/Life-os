import { handle, parseBody, requireApiCitizen } from "@/lib/api";
import { quoteRequestSchema } from "@/lib/validation";
import { createQuote } from "@/services/quotes";

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireApiCitizen();
    return createQuote(user, await parseBody(request, quoteRequestSchema));
  }, 201);
}
