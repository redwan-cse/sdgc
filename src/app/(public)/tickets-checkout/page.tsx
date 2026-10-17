import type { Metadata } from "next";
import { getTicketEvents } from "@/features/tickets/actions";
import { TicketsCheckout } from "@/features/tickets/components/tickets-checkout";

export const metadata: Metadata = {
  title: "Event Tickets & Advance Admissions | Saugatuck Douglas Garden Club",
  description:
    "Order advance tickets for Saugatuck Douglas Garden Club community events and our annual Garden Walk fundraiser.",
};

export default async function TicketsCheckoutPage() {
  const events = await getTicketEvents();

  return <TicketsCheckout events={events} />;
}
