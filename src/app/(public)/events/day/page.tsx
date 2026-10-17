import { getDetroitDateString } from "@/features/events/calendar";
import { EventDayView } from "@/features/events/components/event-day-view";
import { EventViewSelector } from "@/features/events/components/event-view-selector";
import { listEvents } from "@/features/events/queries";

export const metadata = {
  title: "Events Calendar (Day View)",
  description: "Daily schedule view of Saugatuck Douglas Garden Club activities and programs.",
};

interface EventsDayPageProps {
  searchParams: Promise<{
    date?: string;
    query?: string;
  }>;
}

export default async function EventsDayPage(props: EventsDayPageProps) {
  const searchParams = await props.searchParams;
  const todayDetroit = getDetroitDateString(new Date().toISOString());
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const date =
    searchParams.date && dateRegex.test(searchParams.date) ? searchParams.date : todayDetroit;

  const startOfDay = new Date(`${date}T00:00:00Z`).toISOString();
  const endOfDay = new Date(`${date}T23:59:59.999Z`).toISOString();

  const { events, error } = await listEvents({
    view: "day",
    date,
    from: startOfDay,
    to: endOfDay,
    query: searchParams.query,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Day View
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
          Event Daily Schedule
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          View all club activities scheduled for a specific date in America/Detroit time.
        </p>
      </div>

      <EventViewSelector currentView="day" />

      <EventDayView events={events} initialDate={date} error={error} />
    </div>
  );
}
