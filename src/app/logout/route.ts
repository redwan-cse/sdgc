import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeReturnTo } from "@/features/auth/redirects";

async function handleLogout(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") || searchParams.get("redirect_to");

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Graceful fallback if called outside active Next.js request scope
  }

  const destination = next
    ? sanitizeReturnTo(next, "/login?notice=signed_out")
    : "/login?notice=signed_out";

  return NextResponse.redirect(`${origin}${destination}`, { status: 303 });
}

export const GET = handleLogout;
export const POST = handleLogout;
