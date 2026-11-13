import { handle, requireApiCitizen } from "@/lib/api";
import { getActionsView } from "@/services/actions";

export async function GET() {
  return handle(async () => (await getActionsView(await requireApiCitizen())).nudges);
}
