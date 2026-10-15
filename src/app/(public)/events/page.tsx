import { FIXTURE_EVENTS } from "../../../../tests/fixtures/public-content";
import { EventViewSelector } from "@/features/events/components/event-view-selector";
import { EventListView } from "@/features/events/components/event-list-view";

export const metadata = {
  title: "Events Calendar (List View)",
  description:
    "Upcoming gardening workshops, monthly membership meetings, civic planting days, and Garden Walk events in Saugatuck and Douglas, MI.",
};

export default function EventsListPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          What&apos;s Blooming
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
          Events Calendar
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Join us for community workshops, educational lectures, civic planting workbees, and our
          premier Garden Walk fundraiser.
        </p>
      </div>

      <EventViewSelector currentView="list" />

      <EventListView events={FIXTURE_EVENTS} />
    </div>
  );
}
