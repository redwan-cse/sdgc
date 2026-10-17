export interface TicketEvent {
  id: string;
  slug: string;
  title: string;
  date: string;
  time: string;
  location: string;
  advancePriceCents: number;
  dayOfPriceCents: number;
  description: string;
}

export interface TicketCheckoutInput {
  eventId: string;
  quantity: number;
  purchaserName: string;
  purchaserEmail: string;
  purchaserPhone?: string;
  notes?: string;
}

export interface TicketOrder {
  orderId: string;
  orderReference: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketQuantity: number;
  unitPriceCents: number;
  totalCents: number;
  purchaserName: string;
  purchaserEmail: string;
  purchaserPhone: string | null;
  status: "confirmed";
  createdAt: string;
  checkInInstructions: string;
}
