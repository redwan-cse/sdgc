import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { sanitizeReturnTo } from "@/features/auth/redirects";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash") || searchParams.get("token");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next?.includes("reset-password") || type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      const sanitizedNext = sanitizeReturnTo(next, "/profile");
      return NextResponse.redirect(`${origin}${sanitizedNext}`);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      const sanitizedNext = sanitizeReturnTo(next, "/profile");
      return NextResponse.redirect(`${origin}${sanitizedNext}`);
    }
  }

  // Redirect to login with error if verification failed
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
