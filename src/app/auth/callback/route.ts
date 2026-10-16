import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profile";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const sanitizedNext = next.startsWith("/") && !next.startsWith("//") ? next : "/profile";
      return NextResponse.redirect(`${origin}${sanitizedNext}`);
    }
  }

  // Redirect to login with error if verification failed
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
