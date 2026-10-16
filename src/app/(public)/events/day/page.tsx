import { listEvents } from "@/features/events/queries";
import { EventViewSelector } from "@/features/events/components/event-view-selector";
import { EventDayView } from "@/features/events/components/event-day-view";

export const metadata = {
  title: "Events Calendar (Day View)",
  description: "Daily schedule view of Saugatuck Douglas Garden Club activities and programs.",
};

export default async function EventsDayPage() {
  const { events } = await listEvents({ view: "day" });

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

      <EventDayView events={events} initialDate="2026-07-11" />
    </div>
  );
}
