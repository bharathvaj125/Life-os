import { handle, requireApiAdmin } from "@/lib/api";
import { loadDemoData } from "@/services/admin";

export async function POST() {
  return handle(async () => {
    await requireApiAdmin();
    return loadDemoData();
  }, 201);
}
