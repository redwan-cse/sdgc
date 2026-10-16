import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicSupabaseEnv } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("public Supabase configuration", () => {
  it("accepts local Docker endpoints with publishable key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "local-test-key");
    expect(getPublicSupabaseEnv().url).toBe("http://127.0.0.1:54321");
    expect(getPublicSupabaseEnv().publishableKey).toBe("local-test-key");
  });

  it("accepts local Docker endpoints with anon key fallback", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "local-anon-key");
    expect(getPublicSupabaseEnv().url).toBe("http://127.0.0.1:54321");
    expect(getPublicSupabaseEnv().publishableKey).toBe("local-anon-key");
  });

  it("rejects missing credentials and example placeholders", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);
    expect(() => getPublicSupabaseEnv()).toThrow();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "replace-with-local-key");
    expect(() => getPublicSupabaseEnv()).toThrow();
  });
});
