"use server";

import crypto from "node:crypto";
import { z } from "zod";
import type { ActionResult } from "@/features/auth/types";
import type { TicketCheckoutInput, TicketEvent, TicketOrder } from "./types";
import { createClient } from "@/lib/supabase/server";

import { isSimulationAllowed } from "@/features/payments/local-provider";

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
  const events: TicketEvent[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select(
        "id, slug, title, starts_at, ends_at, description, ticket_url, venues(name, city, state)",
      )
      .not("ticket_url", "is", null)
      .eq("status", "published")
      .order("starts_at", { ascending: true });

    if (data && data.length > 0) {
      for (const row of data) {
        const startDate = new Date(row.starts_at);
        const venueInfo = row.venues as { name?: string; city?: string; state?: string } | null;
        const location = venueInfo?.name
          ? `${venueInfo.name}, ${venueInfo.city || "Saugatuck"}, ${venueInfo.state || "MI"}`
          : "Saugatuck & Douglas, MI";

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
          location,
          advancePriceCents: 2000,
          dayOfPriceCents: 2500,
          description: row.description || "",
        });
      }
    }
  } catch {
    // Return empty events on query failure
  }

  return events;
}

export async function processTicketOrderAction(
  rawInput: TicketCheckoutInput,
): Promise<ActionResult<TicketOrder>> {
  if (!isSimulationAllowed()) {
    return {
      success: false,
      error:
        "Online ticket orders are currently in simulated preview mode. Ticket sales simulation is only allowed in local test environments with LOCAL_PAYMENTS_SIMULATION=true.",
    };
  }

  const parsed = ticketCheckoutSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid ticket order details.",
    };
  }

  const input = parsed.data;
  const events = await getTicketEvents();
  const selectedEvent = events.find(
    (e) =>
      e.id === input.eventId ||
      e.slug === input.eventId ||
      (input.eventId === "gw-2026" && e.slug.includes("garden-walk")),
  );

  if (!selectedEvent) {
    return {
      success: false,
      error: "The selected event is not available for online advance ticket orders.",
    };
  }

  const yearMatch =
    selectedEvent.slug.match(/\b(20\d\d)\b/) || selectedEvent.date.match(/\b(20\d\d)\b/);
  const eventYear = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  const orderSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  const orderReference = `SDGC-TKT-${eventYear}-${orderSuffix}`;
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
      "SIMULATED ORDER ONLY (No Payment Collected). Please bring this simulated confirmation receipt to the Tour Check-In Table at Saugatuck City Hall on the morning of the event.",
  };

  return {
    success: true,
    data: order,
  };
}
