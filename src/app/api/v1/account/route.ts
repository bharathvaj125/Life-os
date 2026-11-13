import { handle, parseBody, requireApiUser } from "@/lib/api";
import { accountSchema } from "@/lib/validation";
import { attachAccount } from "@/services/account";

/** Adds an email and password to the signed-in household. */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireApiUser();
    const body = await parseBody(request, accountSchema);
    await attachAccount(user, body);
    return { email: body.email };
  }, 201);
}
