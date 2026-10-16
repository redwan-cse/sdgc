import { notFound } from "next/navigation";
import { getEventBySlug, listEvents } from "@/features/events/queries";
import { EventDetailCard } from "@/features/events/components/event-detail-card";

interface EventDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Not Found" };
  return {
    title: event.title,
    description: event.description,
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) {
    notFound();
  }

  // Get adjacent events for previous/next navigation
  const { events: allEvents } = await listEvents();
  const eventIndex = allEvents.findIndex((e) => e.slug === slug);
  const prevEvent = eventIndex > 0 ? allEvents[eventIndex - 1] : undefined;
  const nextEvent =
    eventIndex >= 0 && eventIndex < allEvents.length - 1 ? allEvents[eventIndex + 1] : undefined;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saugatuckdouglasgardenclub.com";
  const eventUrl = `${siteUrl}/event/${event.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startsAt,
    endDate: event.endsAt,
    eventStatus: event.isCancelled
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venueName,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.venueAddress || "Saugatuck/Douglas area",
        addressLocality: "Saugatuck",
        addressRegion: "MI",
        postalCode: "49453",
        addressCountry: "US",
      },
    },
    image: [`${siteUrl}/images/brand/sdgc-logo.jpg`],
    url: eventUrl,
    ...(event.ticketUrl
      ? {
          offers: {
            "@type": "Offer",
            url: event.ticketUrl,
            price: "0",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            validFrom: event.startsAt,
          },
        }
      : {}),
    organizer: {
      "@type": "Organization",
      name: "Saugatuck Douglas Garden Club",
      url: siteUrl,
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is safely serialized
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EventDetailCard event={event} prevEvent={prevEvent} nextEvent={nextEvent} />
    </div>
  );
}
