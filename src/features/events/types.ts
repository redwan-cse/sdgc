export type EventCalendarView = "list" | "month" | "day";

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  startsAt: string; // ISO 8601 string
  endsAt: string; // ISO 8601 string
  timezone: string; // "America/Detroit"
  allDay: boolean;
  venueName: string;
  venueAddress?: string;
  ticketUrl?: string;
  isPast?: boolean;
  isCancelled?: boolean;
  category?: string;
}

export interface EventPage {
  events: EventSummary[];
  total: number;
  currentView: EventCalendarView;
  selectedDate: string; // YYYY-MM-DD
  error?: string;
}
