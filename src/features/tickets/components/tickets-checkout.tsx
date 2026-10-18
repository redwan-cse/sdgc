"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { TicketEvent, TicketOrder } from "../types";
import { processTicketOrderAction } from "../actions";

interface TicketsCheckoutProps {
  events: TicketEvent[];
}

export function TicketsCheckout({ events }: TicketsCheckoutProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || "gw-2026");
  const [quantity, setQuantity] = useState<number>(2);
  const [purchaserName, setPurchaserName] = useState<string>("");
  const [purchaserEmail, setPurchaserEmail] = useState<string>("");
  const [purchaserPhone, setPurchaserPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<TicketOrder | null>(null);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];
  const unitPrice = selectedEvent ? selectedEvent.advancePriceCents / 100 : 20;
  const totalPrice = unitPrice * quantity;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await processTicketOrderAction({
        eventId: selectedEventId,
        quantity,
        purchaserName,
        purchaserEmail,
        purchaserPhone: purchaserPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to process ticket order.");
      } else if (res.data) {
        setConfirmedOrder(res.data);
      }
    } catch {
      setErrorMessage("An unexpected error occurred while placing your ticket order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmedOrder) {
    return (
      <div className="mx-auto max-w-2xl space-y-8 py-8 px-4">
        {/* Simulated Success Banner */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
            Simulated Order — No Payment Collected
          </div>
          <h2 className="mt-2 font-serif text-2xl font-bold text-foreground">
            Advance Ticket Reservation Preview
          </h2>
          <p className="text-sm text-muted-foreground">
            Local development simulation mode. No financial charges were processed.
          </p>
        </div>

        {/* Official Ticket Receipt Card */}
        <div
          id="ticket-receipt"
          className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-2">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Order Reference (Simulated)
              </span>
              <p
                id="order-reference-code"
                className="font-mono text-xl font-bold text-primary tracking-wide"
              >
                {confirmedOrder.orderReference}
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Order Date
              </span>
              <p className="text-sm text-foreground">
                {new Date(confirmedOrder.createdAt).toLocaleDateString("en-US", {
                  timeZone: "America/Detroit",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif text-xl font-bold text-foreground">
              {confirmedOrder.eventTitle}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Date:</span>{" "}
                <span className="font-medium text-foreground">{confirmedOrder.eventDate}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Time:</span>{" "}
                <span className="font-medium text-foreground">{confirmedOrder.eventTime}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Location:</span>{" "}
                <span className="font-medium text-foreground">{confirmedOrder.eventLocation}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-muted/50 p-4 space-y-2 border border-border/50 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admissions Quantity</span>
              <span className="font-semibold text-foreground">
                {confirmedOrder.ticketQuantity} admission
                {confirmedOrder.ticketQuantity > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit Price</span>
              <span className="text-foreground">
                ${(confirmedOrder.unitPriceCents / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border/60 pt-2 text-base font-bold">
              <span className="text-foreground">Total (Simulated — No Payment Collected)</span>
              <span className="text-primary">
                ${(confirmedOrder.totalCents / 100).toFixed(2)} USD
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm border-t border-border pt-4">
            <h4 className="font-semibold text-foreground">Purchaser Details</h4>
            <p className="text-muted-foreground">
              {confirmedOrder.purchaserName} &bull; {confirmedOrder.purchaserEmail}
              {confirmedOrder.purchaserPhone && ` &bull; ${confirmedOrder.purchaserPhone}`}
            </p>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Tour Check-In Instructions:</p>
            <p>{confirmedOrder.checkInInstructions}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Print / Save Pass
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmedOrder(null);
                setQuantity(1);
              }}
              className="rounded-xl border border-border bg-card px-4 py-3 text-center text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Order More Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-16 px-4 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          No Advance Ticket Sales Currently Open
        </h2>
        <p className="text-sm text-muted-foreground">
          There are currently no published events with online advance ticket checkout available.
          Please check back closer to our scheduled tour dates or view our upcoming schedule on the
          events calendar.
        </p>
        <div className="pt-4">
          <Link
            href={"/events" as Route}
            className="inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View Events Calendar &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Simulation Warning Banner */}
      <div
        className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 p-5 text-sm space-y-1.5 shadow-xs"
        role="alert"
      >
        <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
          SIMULATION NOTICE — NO PAYMENT COLLECTED
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Advance ticket orders on this preview instance operate in local simulation mode. No real
          financial charges will occur, and passes generated here are not valid for official event
          admission.
        </p>
      </div>

      {/* Title & Simulation Notice */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Advance Admissions
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
            Local Simulation Mode — No Live Payments
          </div>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
          Event Ticket Checkout
        </h1>
        <p className="text-muted-foreground">
          Purchase advance tickets for Saugatuck Douglas Garden Club community events and our
          premier Annual Garden Walk Fundraiser.
        </p>
      </div>

      {/* Distinction from Club Membership Notice */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-foreground space-y-1">
        <p className="font-semibold text-amber-800 dark:text-amber-300">Club Membership Notice:</p>
        <p className="text-muted-foreground">
          Event tickets provide admission to public tours and fundraisers. Ticket purchases do not
          register you as an SDGC club member or cover annual dues. To apply for annual club
          membership, please visit our{" "}
          <Link
            href={"/join" as Route}
            className="font-semibold text-primary underline underline-offset-2"
          >
            Membership Application
          </Link>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {errorMessage && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          {/* Event Selection */}
          <div className="space-y-2">
            <label htmlFor="event-select" className="text-sm font-semibold text-foreground">
              Select Ticketed Event
            </label>
            <select
              id="event-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({evt.date}) — ${(evt.advancePriceCents / 100).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Ticket Quantity */}
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-foreground">
              Number of Admissions
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted font-bold text-lg"
                aria-label="Decrease tickets"
              >
                &minus;
              </button>
              <span className="font-mono text-xl font-bold text-foreground w-8 text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted font-bold text-lg"
                aria-label="Increase tickets"
              >
                &#43;
              </button>
              <span className="text-xs text-muted-foreground">
                (${unitPrice.toFixed(2)} each in advance &bull; $
                {selectedEvent ? (selectedEvent.dayOfPriceCents / 100).toFixed(2) : "25.00"} day of
                tour)
              </span>
            </div>
          </div>

          {/* Purchaser Information */}
          <div className="space-y-4 border-t border-border pt-4">
            <h3 className="font-serif text-lg font-bold text-foreground">
              Purchaser Contact Information
            </h3>

            <div className="space-y-1">
              <label htmlFor="purchaser-name" className="text-xs font-semibold text-foreground">
                Full Name *
              </label>
              <input
                id="purchaser-name"
                type="text"
                required
                value={purchaserName}
                onChange={(e) => setPurchaserName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="purchaser-email" className="text-xs font-semibold text-foreground">
                Email Address (Receipt & Pass will be sent here) *
              </label>
              <input
                id="purchaser-email"
                type="email"
                required
                value={purchaserEmail}
                onChange={(e) => setPurchaserEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="purchaser-phone" className="text-xs font-semibold text-foreground">
                Phone Number (Optional)
              </label>
              <input
                id="purchaser-phone"
                type="tel"
                value={purchaserPhone}
                onChange={(e) => setPurchaserPhone(e.target.value)}
                placeholder="(269) 555-0199"
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="order-notes" className="text-xs font-semibold text-foreground">
                Special Tour Notes or Accommodations (Optional)
              </label>
              <textarea
                id="order-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special accessibility or check-in notes..."
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Mobile Order Summary Preview */}
          <div className="block lg:hidden rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-sm shadow-2xs">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-foreground truncate max-w-[220px]">{selectedEvent?.title}</span>
              <span className="text-primary font-bold text-base">${totalPrice.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {quantity} admission{quantity > 1 ? "s" : ""} &bull; ${unitPrice.toFixed(2)} each
              </span>
              <span>Advance Simulation</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary px-6 py-3.5 font-serif text-base font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting
              ? "Confirming Order..."
              : `Confirm Advance Ticket Order ($${totalPrice.toFixed(2)})`}
          </button>
        </form>

        {/* Order Summary Column */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm">
          <h3 className="font-serif text-xl font-bold text-foreground">Order Summary</h3>

          {selectedEvent && (
            <div className="space-y-2 border-b border-border pb-4 text-sm">
              <h4 className="font-semibold text-foreground">{selectedEvent.title}</h4>
              <p className="text-muted-foreground">{selectedEvent.date}</p>
              <p className="text-muted-foreground">{selectedEvent.time}</p>
              <p className="text-xs text-muted-foreground">{selectedEvent.location}</p>
              <p className="text-xs text-muted-foreground pt-1">{selectedEvent.description}</p>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-medium text-foreground">
                {quantity} ticket{quantity > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Advance Price</span>
              <span className="text-foreground">${unitPrice.toFixed(2)} each</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
              <span className="text-foreground">Total Due</span>
              <span className="text-primary">${totalPrice.toFixed(2)} USD</span>
            </div>
          </div>

          <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">100% Civic Support</p>
            <p>
              All ticket proceeds directly fund Saugatuck Douglas Garden Club civic beautification
              plantings, public garden maintenance, and horticulture scholarships.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
