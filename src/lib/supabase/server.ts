import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

// Request-scoped client; authorization belongs in the DAL and in database RLS.
// Phase 4 must add the session-refresh proxy before enabling authenticated routes.
export async function createClient() {
  let cookieStore: {
    getAll: () => Array<{ name: string; value: string }>;
    set: (name: string, value: string, options?: Record<string, unknown>) => void;
  } | null = null;

  try {
    cookieStore = await cookies();
  } catch {
    // Outside a Next.js request scope (e.g. Vitest test runner or CLI context)
    cookieStore = null;
  }

  const env = getPublicSupabaseEnv();

  return createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll: () => (cookieStore ? cookieStore.getAll() : []),
      setAll(cookiesToSet) {
        if (!cookieStore) return;
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore?.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies. The auth proxy handles refresh.
        }
      },
    },
  });
}
