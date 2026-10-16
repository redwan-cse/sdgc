import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { sanitizeReturnTo } from "@/features/auth/redirects";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash") || searchParams.get("token");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const supabase = await createClient();

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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const sanitizedNext = sanitizeReturnTo(next, "/profile");
      return NextResponse.redirect(`${origin}${sanitizedNext}`);
    }
  }

  // Redirect to login with specific error flag if verification failed
  return NextResponse.redirect(`${origin}/login?error=auth-confirm-failed`);
}
