import { handle, parseBody, requireApiUser } from "@/lib/api";
import { footprintSchema } from "@/lib/validation";
import { getFootprintView, saveSnapshot } from "@/services/footprint";

export async function GET() {
  return handle(async () => getFootprintView((await requireApiUser()).id));
}

/** Saves (or replaces) one month. Totals are always computed on the server, never trusted from the client. */
export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireApiUser();
    const { snapshot, bonus } = await saveSnapshot(user.id, await parseBody(request, footprintSchema));
    return { ...snapshot, bonus };
  }, 201);
}
