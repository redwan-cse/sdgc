"use client";

import * as React from "react";
import Link from "next/link";
import {
  formatDetroitDateTimeLocal,
  formatEventDateTime,
  parseDetroitDateTimeLocal,
} from "@/features/events/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminEventRecord, AdminVenueRecord } from "../types";
import { createEventAction, deleteEventAction, updateEventAction } from "../actions";

interface AdminEventsProps {
  initialEvents: AdminEventRecord[];
  initialVenues?: AdminVenueRecord[];
}

export function AdminEvents({ initialEvents, initialVenues = [] }: AdminEventsProps) {
  const [events, setEvents] = React.useState<AdminEventRecord[]>(initialEvents);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [isError, setIsError] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [venues] = React.useState<AdminVenueRecord[]>(initialVenues);
  const [newTitle, setNewTitle] = React.useState("");
  const [newSlug, setNewSlug] = React.useState("");
  const [newStartsAt, setNewStartsAt] = React.useState("2026-08-15T10:00");
  const [newEndsAt, setNewEndsAt] = React.useState("2026-08-15T12:00");
  const [newCategory, setNewCategory] = React.useState("Workshops & Presentations");
  const [newStatus, setNewStatus] = React.useState<"published" | "draft" | "cancelled">(
    "published",
  );
  const [newVenueId, setNewVenueId] = React.useState<string>("");
  const [newDescription, setNewDescription] = React.useState("");

  // Edit Event Form State
  const [editingEvent, setEditingEvent] = React.useState<AdminEventRecord | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editSlug, setEditSlug] = React.useState("");
  const [editStartsAt, setEditStartsAt] = React.useState("");
  const [editEndsAt, setEditEndsAt] = React.useState("");
  const [editCategory, setEditCategory] = React.useState("");
  const [editStatus, setEditStatus] = React.useState<"published" | "draft" | "cancelled">(
    "published",
  );
  const [editDescription, setEditDescription] = React.useState("");
  const [editVenueName, setEditVenueName] = React.useState("");
  const [editVenueId, setEditVenueId] = React.useState<string | undefined>(undefined);

  const handleOpenEdit = (e: AdminEventRecord) => {
    setEditingEvent(e);
    setEditTitle(e.title);
    setEditSlug(e.slug);
    setEditStartsAt(formatDetroitDateTimeLocal(e.startsAt));
    setEditEndsAt(e.endsAt ? formatDetroitDateTimeLocal(e.endsAt) : "");
    setEditCategory(e.category || "Workshops & Presentations");
    setEditStatus((e.status as "published" | "draft" | "cancelled") || "published");
    setEditDescription(e.description || "");
    setEditVenueName(e.venueName || "");
    setEditVenueId(e.venueId);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isModalOpen) setIsModalOpen(false);
        if (editingEvent) setEditingEvent(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, editingEvent]);

  const handleUpdate = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editingEvent) return;
    setIsSubmitting(true);
    setIsError(false);
    try {
      const startsAtIso = parseDetroitDateTimeLocal(editStartsAt);
      const endsAtIso = editEndsAt ? parseDetroitDateTimeLocal(editEndsAt) : undefined;
      const res = await updateEventAction({
        id: editingEvent.id,
        title: editTitle.trim(),
        slug: editSlug.trim(),
        startsAt: startsAtIso,
        endsAt: endsAtIso,
        category: editCategory,
        status: editStatus,
        description: editDescription.trim() || undefined,
        venueId: editVenueId ?? editingEvent.venueId,
        venueName: editVenueName.trim() || undefined,
      });

      if (res.success) {
        setEvents((prev) =>
          prev.map((item) =>
            item.id === editingEvent.id
              ? {
                  ...item,
                  title: editTitle.trim(),
                  slug: editSlug.trim(),
                  startsAt: startsAtIso,
                  endsAt: endsAtIso,
                  category: editCategory,
                  status: editStatus,
                  description: editDescription.trim() || undefined,
                  venueId: editVenueId ?? editingEvent.venueId,
                  venueName: editVenueName.trim() || undefined,
                }
              : item,
          ),
        );
        setNotice(`Event "${editTitle}" updated successfully.`);
        setEditingEvent(null);
      } else {
        setIsError(true);
        setNotice(`Failed to update event: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    const slugified = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setNewSlug(slugified);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedSlug = newSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/(^-|-$)+/g, "");
    if (!newTitle.trim() || !sanitizedSlug) return;

    setIsSubmitting(true);
    setIsError(false);
    try {
      const startsAtIso = parseDetroitDateTimeLocal(newStartsAt);
      const endsAtIso = newEndsAt ? parseDetroitDateTimeLocal(newEndsAt) : undefined;
      const matchedVenue = venues.find((v) => v.id === newVenueId);
      const res = await createEventAction({
        title: newTitle.trim(),
        slug: sanitizedSlug,
        startsAt: startsAtIso,
        endsAt: endsAtIso,
        category: newCategory,
        status: newStatus,
        venueId: newVenueId || undefined,
        description: newDescription.trim() || undefined,
      });

      if (res.success && res.data) {
        const createdId = (res.data as { id: string }).id;
        setEvents((prev) => [
          ...prev,
          {
            id: createdId,
            title: newTitle.trim(),
            slug: sanitizedSlug,
            startsAt: startsAtIso,
            endsAt: endsAtIso,
            category: newCategory,
            status: newStatus,
            venueId: newVenueId || undefined,
            venueName: matchedVenue ? matchedVenue.name : undefined,
            description: newDescription.trim() || undefined,
          },
        ]);
        setNotice(`Event "${newTitle}" created and saved successfully.`);
        setIsModalOpen(false);
        setNewTitle("");
        setNewSlug("");
        setNewVenueId("");
        setNewDescription("");
      } else {
        setIsError(true);
        setNotice(`Failed to create event: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}"?`)) return;

    setIsSubmitting(true);
    setIsError(false);
    try {
      const res = await deleteEventAction(id);
      if (res.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setNotice(`Event "${title}" removed.`);
      } else {
        setIsError(true);
        setNotice(`Failed to delete event: ${res.error}`);
      }
    } catch (err: unknown) {
      setIsError(true);
      setNotice(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
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

        <Button onClick={() => setIsModalOpen(true)}>+ Add New Event</Button>
      </div>

      {notice && (
        <div
          className={`rounded-lg p-3 text-xs border ${
            isError
              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-600/30 text-rose-800 dark:text-rose-300"
              : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-600/30 text-emerald-800 dark:text-emerald-300"
          }`}
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
                <th className="p-4">Category / Excerpt</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                    No scheduled events found.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-semibold text-foreground">
                      <Link
                        href={`/event/${encodeURIComponent(e.slug.replace(/[^a-zA-Z0-9_-]/g, ""))}`}
                        className="hover:underline"
                      >
                        {e.title}
                      </Link>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                      {formatEventDateTime(e.startsAt)}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {e.venueName || "Location Announced Upon Registration"}
                    </td>
                    <td className="p-4 max-w-xs">
                      {e.category && (
                        <span className="text-xs text-muted-foreground line-clamp-2 block leading-snug">
                          {e.category}
                        </span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {e.status === "published" ? (
                        <Badge variant="success">Published</Badge>
                      ) : e.status === "cancelled" ? (
                        <Badge variant="destructive">Cancelled</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSubmitting}
                        onClick={() => handleOpenEdit(e)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isSubmitting}
                        onClick={() => handleDelete(e.id, e.title)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-event-modal-title"
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2
              id="create-event-modal-title"
              className="font-serif text-xl font-bold text-foreground"
            >
              Create New Club Event
            </h2>
            <p className="text-xs text-muted-foreground">
              Published events will appear on the public /events calendar and RSS feeds.
            </p>

            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="new-event-title"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Event Title *
                </label>
                <Input
                  id="new-event-title"
                  required
                  placeholder="e.g. Summer Garden Tour Workbee"
                  value={newTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="new-event-slug"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  URL Slug *
                </label>
                <Input
                  id="new-event-slug"
                  required
                  placeholder="summer-garden-tour-workbee"
                  value={newSlug}
                  onChange={(e) =>
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="new-event-starts-at"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Starts At (Detroit Time) *
                  </label>
                  <Input
                    id="new-event-starts-at"
                    required
                    type="datetime-local"
                    value={newStartsAt}
                    onChange={(e) => setNewStartsAt(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-event-ends-at"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Ends At
                  </label>
                  <Input
                    id="new-event-ends-at"
                    type="datetime-local"
                    value={newEndsAt}
                    onChange={(e) => setNewEndsAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="new-event-category"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="new-event-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="Workshops & Presentations">Workshops & Presentations</option>
                    <option value="Civic Workdays">Civic Workdays</option>
                    <option value="Social Gatherings">Social Gatherings</option>
                    <option value="Annual Fundraiser">Annual Fundraiser</option>
                    <option value="Executive Committee">Executive Committee</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="new-event-status"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Publishing Status
                  </label>
                  <select
                    id="new-event-status"
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(e.target.value as "published" | "draft" | "cancelled")
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-event-venue"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Venue Location
                </label>
                <select
                  id="new-event-venue"
                  value={newVenueId}
                  onChange={(e) => setNewVenueId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">No Venue / Virtual or TBA</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                      {v.city ? ` (${v.city})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="new-event-description"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Description
                </label>
                <textarea
                  id="new-event-description"
                  rows={3}
                  placeholder="Event details, what to bring, and schedule..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Create Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-event-modal-title"
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2
              id="edit-event-modal-title"
              className="font-serif text-xl font-bold text-foreground"
            >
              Edit Club Event
            </h2>
            <p className="text-xs text-muted-foreground">
              Modify event details, schedule dates, venue location, or visibility status.
            </p>

            <form onSubmit={handleUpdate} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="edit-event-title"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Event Title *
                </label>
                <Input
                  id="edit-event-title"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-event-slug"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  URL Slug *
                </label>
                <Input
                  id="edit-event-slug"
                  required
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-event-starts-at"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Starts At (Detroit) *
                  </label>
                  <Input
                    id="edit-event-starts-at"
                    type="datetime-local"
                    required
                    value={editStartsAt}
                    onChange={(e) => setEditStartsAt(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-event-ends-at"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Ends At (Detroit)
                  </label>
                  <Input
                    id="edit-event-ends-at"
                    type="datetime-local"
                    value={editEndsAt}
                    onChange={(e) => setEditEndsAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-event-category"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="edit-event-category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                  >
                    <option value="Workshops & Presentations">Workshops & Presentations</option>
                    <option value="Community Projects">Community Projects</option>
                    <option value="Club Business">Club Business</option>
                    <option value="Social & Special Events">Social & Special Events</option>
                    <option value="Garden Walk">Garden Walk</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="edit-event-status"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="edit-event-status"
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as "published" | "draft" | "cancelled")
                    }
                    className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-event-venue"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Venue Location
                </label>
                <select
                  id="edit-event-venue"
                  value={editVenueId || ""}
                  onChange={(e) => {
                    const vid = e.target.value;
                    setEditVenueId(vid || undefined);
                    const matched = venues.find((v) => v.id === vid);
                    setEditVenueName(matched ? matched.name : "");
                  }}
                  className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                >
                  <option value="">No Venue / Virtual or TBA</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                      {v.city ? ` (${v.city})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="edit-event-description"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                >
                  Description
                </label>
                <textarea
                  id="edit-event-description"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground shadow-xs focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingEvent(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
