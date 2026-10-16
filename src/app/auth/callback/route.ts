import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeReturnTo } from "@/features/auth/redirects";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const sanitizedNext = sanitizeReturnTo(next);
      return NextResponse.redirect(`${origin}${sanitizedNext}`);
    }
  }

  // Redirect to login with error if verification failed
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
