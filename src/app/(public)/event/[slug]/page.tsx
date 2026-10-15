import { notFound } from "next/navigation";
import { FIXTURE_EVENTS } from "../../../../../tests/fixtures/public-content";
import { EventDetailCard } from "@/features/events/components/event-detail-card";

interface EventDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = FIXTURE_EVENTS.find((e) => e.slug === slug);
  if (!event) return { title: "Event Not Found" };
  return {
    title: event.title,
    description: event.description,
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const eventIndex = FIXTURE_EVENTS.findIndex((e) => e.slug === slug);
  const event = FIXTURE_EVENTS[eventIndex];
  if (!event) {
    notFound();
  }
  const prevEvent = eventIndex > 0 ? FIXTURE_EVENTS[eventIndex - 1] : undefined;
  const nextEvent =
    eventIndex < FIXTURE_EVENTS.length - 1 ? FIXTURE_EVENTS[eventIndex + 1] : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <EventDetailCard event={event} prevEvent={prevEvent} nextEvent={nextEvent} />
    </div>
  );
}
