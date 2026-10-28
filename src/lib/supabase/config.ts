export class SupabaseConfigError extends Error {}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || key === "your-supabase-publishable-key") throw new SupabaseConfigError("Supabase configuration is missing.");
  if (key.startsWith("sb_secret_")) throw new SupabaseConfigError("Use a public Supabase key, never a secret key.");
  if (key.split(".").length === 3) {
    try {
      const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (payload.role === "service_role") throw new SupabaseConfigError("Use a public Supabase key, never a service-role key.");
    } catch (error) { if (error instanceof SupabaseConfigError) throw error; }
  }
  try {
    const parsed = new URL(url);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) throw new Error();
    if (parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error();
  } catch { throw new SupabaseConfigError("Supabase URL must use HTTPS (HTTP is allowed only for local development)."); }
  return { url, key };
}
