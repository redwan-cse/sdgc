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

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <EventDetailCard event={event} prevEvent={prevEvent} nextEvent={nextEvent} />
    </div>
  );
}
