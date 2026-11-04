import { handle, parseBody, requireApiUser } from "@/lib/api";
import { profileSchema } from "@/lib/validation";
import { setLeaderboardOptIn } from "@/services/profile";

export async function PATCH(request: Request) {
  return handle(async () => {
    const user = await requireApiUser();
    const { leaderboardOptIn } = await parseBody(request, profileSchema);
    const updated = await setLeaderboardOptIn(user.id, leaderboardOptIn);
    return { leaderboardOptIn: updated?.leaderboardOptIn ?? leaderboardOptIn };
  });
}
