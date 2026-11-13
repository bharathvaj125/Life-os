import { handle, parseBody } from "@/lib/api";
import { VENDOR_SERVICE_IDS } from "@/features/vendors/catalog";
import { vendorSchema } from "@/lib/validation";
import { listApprovedVendors, submitVendor } from "@/services/vendors";
import type { VendorService } from "@/types";

/** Public: approved listings only, optionally filtered by ?service= and ?place= (city or PIN). */
export async function GET(request: Request) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const service = params.get("service") as VendorService | null;
    return listApprovedVendors({
      service: service && VENDOR_SERVICE_IDS.includes(service) ? service : undefined,
      place: params.get("place") ?? undefined,
    });
  });
}

/** Public submission. The listing stays pending until an administrator approves it. */
export async function POST(request: Request) {
  return handle(async () => {
    const vendor = await submitVendor(await parseBody(request, vendorSchema));
    return { id: vendor.id, status: vendor.status };
  }, 201);
}
