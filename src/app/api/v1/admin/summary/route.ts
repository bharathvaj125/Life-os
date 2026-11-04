import { handle, requireApiAdmin } from "@/lib/api";
import { getAdminSummary } from "@/services/admin";

export async function GET() {
  return handle(async () => {
    await requireApiAdmin();
    return getAdminSummary();
  });
}
