import { z } from "zod";

const publicSupabaseSchema = z.object({
  url: z.url(),
  publishableKey: z
    .string()
    .min(1)
    .refine((key) => !key.startsWith("replace-"), {
      message: "Replace the example key with the local Supabase publishable or anon key",
    }),
});

export function getPublicSupabaseEnv() {
  return publicSupabaseSchema.parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
