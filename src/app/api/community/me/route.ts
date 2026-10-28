import { handleApi, success } from "@/lib/utils/api-server";
import { userRpc } from "@/lib/utils/domain-rpc";
import type { CommunitySummary } from "@/types/domain";

export async function GET() {
  return handleApi(async () => success(await userRpc<CommunitySummary>("community_summary")));
}
