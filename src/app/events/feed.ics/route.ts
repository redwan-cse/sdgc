import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { generateICalendarFeed, type IcsEventInput } from "@/features/events/ics";

export async function GET() {
  const supabase = createPublicClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saugatuckdouglasgardenclub.com";

  const { data: rows } = await supabase
    .from("events")
    .select(
      "id, slug, title, description, starts_at, ends_at, all_day, timezone, venues(name, address, city, state)",
    )
    .eq("status", "published")
    .order("starts_at", { ascending: true });

  const events: IcsEventInput[] = (rows || []).map((row) => {
    const venue = row.venues as {
      name?: string;
      address?: string;
      city?: string;
      state?: string;
    } | null;
    const locationParts = [venue?.name, venue?.address, venue?.city, venue?.state].filter(Boolean);

    return {
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
  });

  const icsContent = generateICalendarFeed(events);

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="sdgc-events.ics"',
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
