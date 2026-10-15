import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

// Request-scoped client; authorization belongs in the DAL and in database RLS.
// Phase 4 must add the session-refresh proxy before enabling authenticated routes.
export async function createClient() {
  const cookieStore = await cookies();
  const env = getPublicSupabaseEnv();

  return createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. The auth proxy handles refresh.
        }
      },
    },
  });
}
