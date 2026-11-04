import type { Repository } from "./repository";
import { fileStore } from "./file-store";
import { supabaseStore } from "./supabase-store";

/**
 * Uses Supabase PostgreSQL when its URL and a server-side key are configured, otherwise the local
 * JSON demo store. Services never import a concrete store.
 */
export function getRepository(): Repository {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseStore() : fileStore;
}

export function storageMode(): "supabase" | "local-demo" {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "local-demo";
}
