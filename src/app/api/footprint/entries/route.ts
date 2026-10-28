import { handleApi, success } from "@/lib/utils/api-server";
import { userRpc } from "@/lib/utils/domain-rpc";
import { assertSameOrigin, readJson } from "@/lib/utils/request";
import { parseFootprint, parseLimit, parseCursor } from "@/lib/utils/domain-validation";
import type { FootprintEntry, FootprintHistory } from "@/types/domain";

export async function POST(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const input = parseFootprint(await readJson(request));
    return success(await userRpc<FootprintEntry>("save_footprint", { p_start: input.periodStart, p_end: input.periodEnd, p_kwh: input.electricityKwh }), 201);
  });
}
export async function GET(request: Request) {
  return handleApi(async () => {
    const query = new URL(request.url).searchParams;
    const limit = parseLimit(query.get("limit"));
    const cursor = parseCursor(query.get("cursor"));
    return success(await userRpc<FootprintHistory>("footprint_history", { p_limit: limit, p_cursor_date: cursor?.date ?? null, p_cursor_id: cursor?.id ?? null }));
  });
}
