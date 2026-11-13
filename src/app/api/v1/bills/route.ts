import { handle, parseBody, requireApiCitizen } from "@/lib/api";
import { billSchema } from "@/lib/validation";
import { saveScannedBill } from "@/services/bills";

/**
 * Saves a month from a scanned bill. The photo is read on the user's own device and never reaches this server,
 * only the confirmed numbers do, and every one of them is checked again here.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireApiCitizen();
    const { snapshot, bonus, proof } = await saveScannedBill(user, await parseBody(request, billSchema));
    return { ...snapshot, bonus, proof };
  }, 201);
}
