import { type NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { generateICalendarFeed, type IcsEventInput } from "@/features/events/ics";

export async function GET(_request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const supabase = createPublicClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saugatuckdouglasgardenclub.com";

  const { data: row } = await supabase
    .from("events")
    .select(
      "id, slug, title, description, starts_at, ends_at, all_day, timezone, venues(name, address, city, state)",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!row) {
    return new NextResponse("Event not found", { status: 404 });
  }

  const venue = row.venues as {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
  } | null;
  const locationParts = [venue?.name, venue?.address, venue?.city, venue?.state].filter(Boolean);

  const eventItem: IcsEventInput = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    allDay: row.all_day,
    timezone: row.timezone,
    location: locationParts.join(", "),
    url: `${siteUrl}/event/${row.slug}`,
  };

  const icsContent = generateICalendarFeed([eventItem], row.title);

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${row.slug}.ics"`,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
