import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Server-only administrative client with the service role key.
 * Strictly used for server-side trusted actions such as payment confirmation simulation
 * and background tasks. Never exposed to browser or client components.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required for server administrative operations.",
    );
  }
  const env = getPublicSupabaseEnv();
  return createSupabaseClient<Database>(env.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
