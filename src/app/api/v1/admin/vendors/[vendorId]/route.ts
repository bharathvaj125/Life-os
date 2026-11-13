import { handle, parseBody, requireApiAdmin } from "@/lib/api";
import { vendorReviewSchema } from "@/lib/validation";
import { reviewVendor } from "@/services/vendors";

export async function PATCH(request: Request, { params }: { params: Promise<{ vendorId: string }> }) {
  return handle(async () => {
    await requireApiAdmin();
    const { decision } = await parseBody(request, vendorReviewSchema);
    const vendor = await reviewVendor((await params).vendorId, decision);
    return { id: vendor.id, status: vendor.status };
  });
}
