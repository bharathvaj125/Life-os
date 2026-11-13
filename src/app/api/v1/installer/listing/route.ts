import { handle, parseBody, requireApiInstaller } from "@/lib/api";
import { vendorSchema } from "@/lib/validation";
import { saveListing } from "@/services/installer";

/** Saves the installer's own listing. Changes go back to an administrator for review. */
export async function PUT(request: Request) {
  return handle(async () => {
    const user = await requireApiInstaller();
    const listing = await saveListing(user, await parseBody(request, vendorSchema));
    return { id: listing.id, status: listing.status };
  });
}
