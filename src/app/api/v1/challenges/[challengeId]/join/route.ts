import { handle, requireApiUser } from "@/lib/api";
import { joinChallenge } from "@/services/community";

export async function POST(_request: Request, { params }: { params: Promise<{ challengeId: string }> }) {
  return handle(async () => {
    const user = await requireApiUser();
    await joinChallenge(user, (await params).challengeId);
    return { joined: true };
  }, 201);
}
