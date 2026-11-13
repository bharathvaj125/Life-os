import { z } from "zod";
import { handle } from "@/lib/api";
import { getWeatherForPincode } from "@/services/weather";

const query = z.object({ pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code") });

/** Public: today's forecast for a Gujarat PIN code, or { weather: null } when it is outside Gujarat or the forecast is unavailable. */
export async function GET(request: Request) {
  return handle(async () => {
    const { pincode } = query.parse({ pincode: new URL(request.url).searchParams.get("pincode") ?? "" });
    return { weather: await getWeatherForPincode(pincode) };
  });
}
