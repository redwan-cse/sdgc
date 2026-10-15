"use client";

import * as React from "react";
import Link from "next/link";
import { formatEventDateTime } from "@/features/events/calendar";
import { FIXTURE_EVENTS } from "../../../../tests/fixtures/public-content";
import type { EventSummary } from "@/features/events/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AdminEvents() {
  const [events, setEvents] = React.useState<EventSummary[]>(FIXTURE_EVENTS);
  const [notice, setNotice] = React.useState<string | null>(null);

  const handleDelete = (id: string, title: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setNotice(`Event "${title}" removed.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Events & Calendar Scheduling
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule club meetings, plant sales, work days, and the annual Garden Walk fundraiser.
          </p>
        </div>

        <Button
          onClick={() =>
            setNotice(
              "Event creation dialog: In Phase 5/6 this creates a real event record in Postgres.",
            )
          }
        >
          + Add New Event
        </Button>
      </div>

      {notice && (
        <div
          className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs text-primary"
          role="status"
        >
          {notice}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Event Title</th>
                <th className="p-4">Date & Time (America/Detroit)</th>
                <th className="p-4">Venue</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-semibold text-foreground">
                    <Link href={`/event/${e.slug}`} className="hover:underline">
                      {e.title}
                    </Link>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {formatEventDateTime(e.startsAt)}
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">{e.venueName}</td>
                  <td className="p-4">
                    {e.category && <Badge variant="secondary">{e.category}</Badge>}
                  </td>
                  <td className="p-4">
                    {e.isPast ? (
                      <Badge variant="outline">Past Event</Badge>
                    ) : (
                      <Badge variant="success">Published</Badge>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNotice(`Editing event: ${e.title}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(e.id, e.title)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
