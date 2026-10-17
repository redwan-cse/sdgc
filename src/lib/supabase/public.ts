import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Creates an unauthenticated, cookie-free Supabase client for public route handlers (feeds, sitemaps).
 * Uses publishable key and enforces anonymous Row-Level Security policies.
 */
export function createPublicClient() {
  const env = getPublicSupabaseEnv();
  return createSupabaseClient<Database>(env.url, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
