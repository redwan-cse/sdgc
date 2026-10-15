import { FIXTURE_EVENTS } from "../../../../../tests/fixtures/public-content";
import { EventViewSelector } from "@/features/events/components/event-view-selector";
import { EventMonthView } from "@/features/events/components/event-month-view";

export const metadata = {
  title: "Events Calendar (Month View)",
  description:
    "Monthly calendar view of Saugatuck Douglas Garden Club workshops, civic plantings, and tour dates.",
};

export default function EventsMonthPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Monthly View
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
          Events Month Calendar
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Browse club events across the calendar year. Click any event to view schedule details.
        </p>
      </div>

      <EventViewSelector currentView="month" />

      <EventMonthView events={FIXTURE_EVENTS} initialYear={2026} initialMonth={7} />
    </div>
  );
}
