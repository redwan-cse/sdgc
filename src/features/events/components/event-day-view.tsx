"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  eventOccursOnDate,
  formatEventDate,
  formatEventTime,
  getDetroitDateString,
} from "../calendar";
import type { EventSummary } from "../types";
import { Badge } from "@/components/ui/badge";

interface EventDayViewProps {
  events: EventSummary[];
  initialDate?: string; // YYYY-MM-DD
  error?: string;
}

export function EventDayView({ events, initialDate, error }: EventDayViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const effectiveInitialDate = initialDate || getDetroitDateString(new Date().toISOString());

  const [selectedDate, setSelectedDate] = React.useState(effectiveInitialDate);

  // Keep state in sync if initialDate changes from searchParams
  React.useEffect(() => {
    if (initialDate && initialDate !== selectedDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate, selectedDate]);

  const updateDate = (newDate: string) => {
    setSelectedDate(newDate);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("date", newDate);
    router.replace(`/events/day?${params.toString()}`, { scroll: false });
  };

  const dayEvents = React.useMemo(() => {
    return events.filter((e) => eventOccursOnDate(e, selectedDate));
  }, [events, selectedDate]);

  const handlePrevDay = () => {
    const d = new Date(`${selectedDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    const newDateStr = d.toISOString().slice(0, 10);
    updateDate(newDateStr);
  };

  const handleNextDay = () => {
    const d = new Date(`${selectedDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    const newDateStr = d.toISOString().slice(0, 10);
    updateDate(newDateStr);
  };

  return (
    <div className="space-y-6">
      {/* Day Navigator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handlePrevDay}
            className="rounded-md border border-border bg-card p-2 text-foreground hover:bg-muted cursor-pointer"
            aria-label="Previous day"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
            {formatEventDate(`${selectedDate}T12:00:00Z`)}
          </h2>
          <button
            type="button"
            onClick={handleNextDay}
            className="rounded-md border border-border bg-card p-2 text-foreground hover:bg-muted cursor-pointer"
            aria-label="Next day"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <label htmlFor="day-picker" className="text-xs text-muted-foreground">
            Jump to date:
          </label>
          <input
            id="day-picker"
            type="date"
            value={selectedDate}
            onChange={(e) => updateDate(e.target.value)}
            className="rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground"
          />
        </div>
      </div>

      {/* Events for this day */}
      {error ? (
        <div
          className="rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center text-destructive"
          role="alert"
        >
          <p className="text-base font-semibold">Unable to load calendar events</p>
          <p className="text-xs mt-1 text-muted-foreground">{error}</p>
        </div>
      ) : dayEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <p className="text-base font-medium">No events scheduled for this day.</p>
          <p className="text-xs mt-1">
            Check the Month Calendar or browse the List View for upcoming club activities.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {dayEvents.map((event) => (
            <article
              key={event.id}
              className="rounded-xl border border-border bg-card p-6 shadow-xs hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-primary text-base">
                    {formatEventTime(event.startsAt)} – {formatEventTime(event.endsAt)}
                  </span>
                  {event.category && <Badge variant="secondary">{event.category}</Badge>}
                </div>
                <span className="text-xs text-muted-foreground">Timezone: {event.timezone}</span>
              </div>

              <h3 className="font-serif text-2xl font-bold text-foreground">
                <Link href={`/event/${event.slug}`} className="hover:underline">
                  {event.title}
                </Link>
              </h3>

              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {event.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/60 text-xs">
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>
                    {event.venueName} {event.venueAddress ? `(${event.venueAddress})` : ""}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  {event.ticketUrl && (
                    <Link
                      href={event.ticketUrl as Route}
                      className="font-semibold text-primary hover:underline"
                    >
                      Tickets & RSVP &rarr;
                    </Link>
                  )}
                  <Link
                    href={`/event/${event.slug}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    Event Details &rarr;
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
