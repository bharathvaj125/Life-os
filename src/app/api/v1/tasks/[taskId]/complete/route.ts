import { handle, requireApiCitizen } from "@/lib/api";
import { completeTask } from "@/services/actions";

export async function POST(_request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  return handle(async () => {
    const user = await requireApiCitizen();
    return completeTask(user, (await params).taskId);
  }, 201);
}
