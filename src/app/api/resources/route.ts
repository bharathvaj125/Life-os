import { handleApi, success } from "@/lib/utils/api-server";
import { createClient } from "@/lib/supabase/server";
import { InputError } from "@/lib/utils/validation";
import { RequestError } from "@/lib/utils/request";
import type { Resource } from "@/types/domain";

export async function GET(request: Request) {
  return handleApi(async () => {
    const category = new URL(request.url).searchParams.get("category");
    if (category !== null && !["energy", "solar", "habits"].includes(category)) throw new InputError({ category: "Choose energy, solar, or habits." });
    const supabase = await createClient();
    let query = supabase.from("resources").select("id,title,description,category,source_url,reviewed_on").eq("published", true).order("title").order("id").limit(100);
    if (category) query = query.eq("category", category);
    const { data, error } = await query;
    if (error) throw new RequestError("SERVICE_UNAVAILABLE", "Resources are temporarily unavailable.", 503);
    const resources: Resource[] = (data ?? []).map(row => ({ id: row.id, title: row.title, description: row.description, category: row.category, sourceUrl: row.source_url, reviewedOn: row.reviewed_on }));
    return success({ resources });
  });
}
