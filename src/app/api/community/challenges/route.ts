import { handleApi, success } from "@/lib/utils/api-server";
import { userRpc } from "@/lib/utils/domain-rpc";
import type { Challenge } from "@/types/domain";

export async function GET() {
  return handleApi(async () => success(await userRpc<{ challenges: Challenge[] }>("list_challenges")));
}
