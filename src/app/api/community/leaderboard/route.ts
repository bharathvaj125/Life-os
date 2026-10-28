import { handleApi, success } from "@/lib/utils/api-server";
import { userRpc } from "@/lib/utils/domain-rpc";
import { parseLimit } from "@/lib/utils/domain-validation";
import type { LeaderboardEntry } from "@/types/domain";

export async function GET(request: Request) {
  return handleApi(async () => success(await userRpc<{ entries: LeaderboardEntry[] }>("community_leaderboard", { p_limit: parseLimit(new URL(request.url).searchParams.get("limit")) })));
}
