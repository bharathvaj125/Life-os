import { ApiError, handle, parseBody, requireApiCitizen } from "@/lib/api";
import { homeProfileSchema } from "@/lib/validation";
import { getRepository } from "@/lib/store";

/** Updates the household's home profile and equipment, which changes the tips and tasks it sees. */
export async function PUT(request: Request) {
  return handle(async () => {
    const user = await requireApiCitizen();
    if (user.isDemo) throw new ApiError(403, "Demo accounts are shared, so their home cannot be changed.");
    const body = await parseBody(request, homeProfileSchema);
    await getRepository().updateUser(user.id, body);
    return { saved: true };
  });
}
