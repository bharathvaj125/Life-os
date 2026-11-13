import { handle, parseBody, requireApiAdmin } from "@/lib/api";
import { vendorVerifySchema } from "@/lib/validation";
import { clearVendorVerification, verifyVendor } from "@/services/vendors";

export async function POST(request: Request, { params }: { params: Promise<{ vendorId: string }> }) {
  return handle(async () => {
    await requireApiAdmin();
    const { note } = await parseBody(request, vendorVerifySchema);
    const v = await verifyVendor((await params).vendorId, note);
    return { id: v.id, verifiedOn: v.verifiedOn };
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ vendorId: string }> }) {
  return handle(async () => {
    await requireApiAdmin();
    const v = await clearVendorVerification((await params).vendorId);
    return { id: v.id };
  });
}
