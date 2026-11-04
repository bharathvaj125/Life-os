import { handle, parseBody } from "@/lib/api";
import { SOLAR_ASSUMPTIONS, estimateSolar } from "@/lib/calculations/solar";
import { solarSchema } from "@/lib/validation";

/** Stateless estimate: nothing is stored, so it works for visitors who have not onboarded. */
export async function POST(request: Request) {
  return handle(async () => ({ estimate: estimateSolar(await parseBody(request, solarSchema)), assumptions: SOLAR_ASSUMPTIONS }));
}
