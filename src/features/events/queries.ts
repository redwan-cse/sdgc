import { createClient } from "@/lib/supabase/server";
import { CLUB_TIMEZONE, getDetroitDateString } from "./calendar";
import type { EventCalendarView, EventPage, EventSummary } from "./types";

export interface EventFilterOptions {
  query?: string;
  category?: string;
  from?: string;
  to?: string;
  view?: EventCalendarView;
  date?: string;
}

interface EventRowWithVenue {
  id: string;
  slug: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  all_day: boolean;
  status: string;
  category: string | null;
  ticket_url: string | null;
  venues: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
  } | null;
}

export async function listEvents(filters: EventFilterOptions = {}): Promise<EventPage> {
  const supabase = await createClient();
  const currentView: EventCalendarView = filters.view || "list";
  const selectedDate: string =
    filters.date || getDetroitDateString(new Date().toISOString(), CLUB_TIMEZONE);

  let query = supabase
    .from("events")
    .select(
      `
      id,
      slug,
      title,
      description,
      starts_at,
      ends_at,
      timezone,
      all_day,
      status,
      category,
      ticket_url,
      venues (
        name,
        address,
        city,
        state,
        postal_code
      )
    `,
    )
    .eq("status", "published")
    .order("starts_at", { ascending: true });

  if (filters.query) {
    const sanitized = filters.query.replace(/[,()]/g, " ").trim();
    if (sanitized) {
      query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
    }
  }

  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  // Multi-day overlap semantics (V11-07):
  // An event overlaps interval [from, to] if:
  // 1. starts_at <= to
  // 2. ends_at >= from OR (ends_at IS NULL and starts_at >= from)
  if (filters.to) {
    query = query.lte("starts_at", filters.to);
  }

  if (filters.from) {
    query = query.or(
      `ends_at.gte.${filters.from},and(ends_at.is.null,starts_at.gte.${filters.from})`,
    );
  }

  // Default limit: 500 to ensure upcoming events are not truncated by historical rows
  query = query.limit(500);

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching events:", error);
    return {
      events: [],
      total: 0,
      currentView,
      selectedDate,
      error: error ? error.message : "Failed to load events",
    };
  }

  const now = new Date();
  const rawEvents = data as unknown as EventRowWithVenue[];

  const events: EventSummary[] = rawEvents.map((item) => {
    const venue = item.venues;
    const fullAddress = venue
      ? [venue.address, venue.city, venue.state, venue.postal_code].filter(Boolean).join(", ")
      : undefined;

    const startsDate = new Date(item.starts_at);
    const endsDate = item.ends_at ? new Date(item.ends_at) : startsDate;

    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      description: item.description || "",
      startsAt: item.starts_at,
      endsAt: item.ends_at,
      timezone: item.timezone || CLUB_TIMEZONE,
      allDay: Boolean(item.all_day),
      category: item.category || undefined,
      venueName: venue?.name || "TBD Saugatuck / Douglas",
      venueAddress: fullAddress,
      ticketUrl: item.ticket_url || undefined,
      isPast: endsDate < now,
    };
  });

  return {
    events,
    total: events.length,
    currentView,
    selectedDate,
  };
}

export async function getEventBySlug(slug: string): Promise<EventSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      id,
      slug,
      title,
      description,
      starts_at,
      ends_at,
      timezone,
      all_day,
      status,
      category,
      ticket_url,
      venues (
        name,
        address,
        city,
        state,
        postal_code
      )
    `,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const item = data as unknown as EventRowWithVenue;
  const venue = item.venues;

  const fullAddress = venue
    ? [venue.address, venue.city, venue.state, venue.postal_code].filter(Boolean).join(", ")
    : undefined;

  const startsDate = new Date(item.starts_at);
  const endsDate = item.ends_at ? new Date(item.ends_at) : startsDate;
  const now = new Date();

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.description || "",
    startsAt: item.starts_at,
    endsAt: item.ends_at,
    timezone: item.timezone || CLUB_TIMEZONE,
    allDay: Boolean(item.all_day),
    category: item.category || undefined,
    venueName: venue?.name || "TBD Saugatuck / Douglas",
    venueAddress: fullAddress,
    ticketUrl: item.ticket_url || undefined,
    isPast: endsDate < now,
  };
}

export async function listUpcomingEvents(limit: number = 3): Promise<EventSummary[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Try fetching future events first
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      id,
      slug,
      title,
      description,
      starts_at,
      ends_at,
      timezone,
      all_day,
      status,
      category,
      ticket_url,
      venues (
        name,
        address,
        city,
        state,
        postal_code
      )
    `,
    )
    .eq("status", "published")
    .gte("ends_at", now)
    .order("starts_at", { ascending: true })
    .limit(limit);

  const rawRows: EventRowWithVenue[] = [];
  if (!error && data && data.length > 0) {
    rawRows.push(...(data as unknown as EventRowWithVenue[]));
  } else {
    // If no future events exist, display the most recent published events
    const { data: recent } = await supabase
      .from("events")
      .select(
        `
        id,
        slug,
        title,
        description,
        starts_at,
        ends_at,
        timezone,
        all_day,
        status,
        category,
        ticket_url,
        venues (
          name,
          address,
          city,
          state,
          postal_code
        )
      `,
      )
      .eq("status", "published")
      .order("starts_at", { ascending: false })
      .limit(limit);

    if (recent) {
      rawRows.push(...(recent as unknown as EventRowWithVenue[]));
    }
  }

  const nowDate = new Date();
  return rawRows.map((item) => {
    const venue = item.venues;
    const fullAddress = venue
      ? [venue.address, venue.city, venue.state, venue.postal_code].filter(Boolean).join(", ")
      : undefined;

    const startsDate = new Date(item.starts_at);
    const endsDate = item.ends_at ? new Date(item.ends_at) : startsDate;

    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      description: item.description || "",
      startsAt: item.starts_at,
      endsAt: item.ends_at,
      timezone: item.timezone || CLUB_TIMEZONE,
      allDay: Boolean(item.all_day),
      category: item.category || undefined,
      venueName: venue?.name || "TBD Saugatuck / Douglas",
      venueAddress: fullAddress,
      ticketUrl: item.ticket_url || undefined,
      isPast: endsDate < nowDate,
    };
  });
}
