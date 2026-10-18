import { listEvents } from "@/features/events/queries";
import { EventViewSelector } from "@/features/events/components/event-view-selector";
import { EventListView } from "@/features/events/components/event-list-view";
import { serializeJsonLd } from "@/lib/jsonld";

export const metadata = {
  title: "Events Calendar (List View)",
  description:
    "Upcoming gardening workshops, monthly membership meetings, civic planting days, and Garden Walk events in Saugatuck and Douglas, MI.",
};

interface EventsListPageProps {
  searchParams: Promise<{
    query?: string;
    category?: string;
  }>;
}

export default async function EventsListPage(props: EventsListPageProps) {
  const searchParams = await props.searchParams;
  const { events, error } = await listEvents({
    view: "list",
    query: searchParams.query,
    category: searchParams.category,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saugatuckdouglasgardenclub.com";
  const eventsJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events.map((e, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Event",
        name: e.title,
        description: e.description,
        startDate: e.startsAt,
        endDate: e.endsAt,
        url: `${siteUrl}/event/${encodeURIComponent(e.slug)}`,
        location: {
          "@type": "Place",
          name: e.venueName,
        },
      },
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is safely serialized
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(eventsJsonLd) }}
      />
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

      <EventListView
        events={events}
        error={error}
        initialQuery={searchParams.query}
        initialCategory={searchParams.category}
      />
    </div>
  );
}
