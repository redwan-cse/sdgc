"use server";

import crypto from "node:crypto";
import { z } from "zod";
import type { ActionResult } from "@/features/auth/types";
import type { TicketCheckoutInput, TicketEvent, TicketOrder } from "./types";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_GARDEN_WALK_EVENT: TicketEvent = {
  id: "gw-2026",
  slug: "2026-garden-walk-fundraiser",
  title: "Annual Garden Walk Fundraiser",
  date: "Saturday, July 11, 2026",
  time: "10:00 AM - 4:00 PM EDT",
  location: "Saugatuck City Hall & Coastal Garden Sites, Saugatuck, MI",
  advancePriceCents: 2000, // $20.00
  dayOfPriceCents: 2500, // $25.00
  description:
    "Self-guided tour of exceptional private and public gardens across Saugatuck and Douglas. Advance tickets $20; day of tour $25. All proceeds fund club civic plantings and local student scholarships.",
};

const ticketCheckoutSchema = z.object({
  eventId: z.string().min(1, "Please select an event."),
  quantity: z
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "You must order at least 1 ticket.")
    .max(20, "Maximum 20 tickets per order."),
  purchaserName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name cannot exceed 100 characters."),
  purchaserEmail: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .max(150, "Email cannot exceed 150 characters."),
  purchaserPhone: z.string().trim().max(30).optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function getTicketEvents(): Promise<TicketEvent[]> {
  const events: TicketEvent[] = [DEFAULT_GARDEN_WALK_EVENT];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select("id, slug, title, starts_at, description, ticket_url")
      .not("ticket_url", "is", null)
      .eq("status", "published");

    if (data && data.length > 0) {
      for (const row of data) {
        if (row.slug !== DEFAULT_GARDEN_WALK_EVENT.slug) {
          const startDate = new Date(row.starts_at);
          events.push({
            id: row.id,
            slug: row.slug,
            title: row.title,
            date: startDate.toLocaleDateString("en-US", {
              timeZone: "America/Detroit",
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            time: startDate.toLocaleTimeString("en-US", {
              timeZone: "America/Detroit",
              hour: "numeric",
              minute: "2-digit",
            }),
            location: "Saugatuck & Douglas, MI",
            advancePriceCents: 2000,
            dayOfPriceCents: 2500,
            description: row.description,
          });
        }
      }
    }
  } catch {
    // Return default ticket event if query fails
  }

  return events;
}

export async function processTicketOrderAction(
  rawInput: TicketCheckoutInput,
): Promise<ActionResult<TicketOrder>> {
  const parsed = ticketCheckoutSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid ticket order details.",
    };
  }

  const input = parsed.data;
  const events = await getTicketEvents();
  const selectedEvent = events.find((e) => e.id === input.eventId || e.slug === input.eventId);

  if (!selectedEvent) {
    return {
      success: false,
      error: "The selected event is not available for online advance ticket orders.",
    };
  }

  const orderSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  const orderReference = `SDGC-TKT-2026-${orderSuffix}`;
  const totalCents = input.quantity * selectedEvent.advancePriceCents;

  const order: TicketOrder = {
    orderId: crypto.randomUUID(),
    orderReference,
    eventId: selectedEvent.id,
    eventTitle: selectedEvent.title,
    eventDate: selectedEvent.date,
    eventTime: selectedEvent.time,
    eventLocation: selectedEvent.location,
    ticketQuantity: input.quantity,
    unitPriceCents: selectedEvent.advancePriceCents,
    totalCents,
    purchaserName: input.purchaserName,
    purchaserEmail: input.purchaserEmail,
    purchaserPhone: input.purchaserPhone || null,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    checkInInstructions:
      "Please bring this confirmation order receipt (printed or on your mobile device) to the Tour Check-In Table at Saugatuck City Hall on the morning of the event to collect your wristbands and tour guide maps.",
  };

  return {
    success: true,
    data: order,
  };
}
