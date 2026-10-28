import { handleApi, success } from "@/lib/utils/api-server";
import { requireUser } from "@/lib/supabase/auth";
import { assertSameOrigin, readJson, RequestError } from "@/lib/utils/request";
import { parseProfile } from "@/lib/utils/validation";
import type { Profile } from "@/types/api";

const columns = "id, display_name, state, district, household_size, community_opt_in, created_at, updated_at";
type Row = { id: string; display_name: string; state: string; district: string | null; household_size: number; community_opt_in: boolean; created_at: string; updated_at: string };
function profile(row: Row): Profile {
  return { id: row.id, displayName: row.display_name, state: row.state, district: row.district, householdSize: row.household_size, communityOptIn: row.community_opt_in, createdAt: row.created_at, updatedAt: row.updated_at };
}
function databaseFailure(): never { throw new RequestError("SERVICE_UNAVAILABLE", "Profile storage is temporarily unavailable.", 503); }
export async function GET() {
  return handleApi(async () => {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase.from("profiles").select(columns).eq("id", user.id).maybeSingle();
    if (error) databaseFailure();
    return success({ profile: data ? profile(data) : null });
  });
}
export async function PUT(request: Request) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const { supabase, user } = await requireUser();
    const input = parseProfile(await readJson(request));
    const { data, error } = await supabase.from("profiles").upsert({ id: user.id, display_name: input.displayName, state: input.state, district: input.district, household_size: input.householdSize, community_opt_in: input.communityOptIn }, { onConflict: "id" }).select(columns).single();
    if (error || !data) databaseFailure();
    return success({ profile: profile(data) });
  });
}
