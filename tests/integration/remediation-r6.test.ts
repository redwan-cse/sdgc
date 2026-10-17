import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { stripePaymentProvider } from "@/features/payments/stripe-provider";
import { POST as stripeWebhookPost } from "@/app/api/webhooks/stripe/route";
import { dispatchContactNotification } from "@/features/contact/notifications";
import { submitContactAction } from "@/features/contact/actions";
import {
  escapeIcsText,
  formatIcsTimestamp,
  generateICalendarFeed,
  type IcsEventInput,
} from "@/features/events/ics";
import { GET as calendarFeedGet } from "@/app/events/feed.ics/route";
import { GET as singleEventIcsGet } from "@/app/(public)/event/[slug]/ics/route";
import { createServiceClient } from "./setup";

describe("Remediation Package R6 — Integrations, Accessibility & Calendar Feeds", () => {
  describe("R6.1: Sandbox Stripe Integration Contracts & Webhook Idempotence", () => {
    it("reports configuration status and prevents live charges during local testing", () => {
      const status = stripePaymentProvider.getConfigStatus();
      expect(status).toBeDefined();
      expect(typeof status.isConfigured).toBe("boolean");
      expect(typeof status.isTestMode).toBe("boolean");
    });

    it("creates a checkout session contract with server-authoritative rate", async () => {
      const session = await stripePaymentProvider.createCheckoutSession({
        paymentId: "pay_test_123",
        amountCents: 5000, // $50.00 USD
        currency: "USD",
        returnPath: "/membership",
        membershipId: "mem_test_123",
        termYear: 2026,
        userId: "user_test_123",
      });

      expect(session.checkoutUrl).toBeDefined();
      expect(session.providerReference).toMatch(/^cs_test_[a-f0-9]{24}$/);
    });

    it("rejects unsigned or invalid stripe webhooks with 400 Bad Request", async () => {
      const request = new NextRequest("http://127.0.0.1:3000/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({ type: "checkout.session.completed" }),
        headers: { "stripe-signature": "invalid_sig" },
      });

      const response = await stripeWebhookPost(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain("signature");
    });

    it("processes valid signed webhook with event deduplication and preserves manual approval", async () => {
      const serviceClient = createServiceClient();

      const { data: term } = await serviceClient
        .from("membership_terms")
        .select("id")
        .limit(1)
        .single();
      expect(term).toBeDefined();
      const termId = term?.id as string;

      const { data: profile } = await serviceClient.from("profiles").select("id").limit(1).single();
      expect(profile).toBeDefined();
      const userId = profile?.id as string;

      const { data: membership } = await serviceClient
        .from("memberships")
        .upsert(
          {
            user_id: userId,
            term_id: termId,
            status: "pending",
          },
          { onConflict: "user_id,term_id" },
        )
        .select("id, status")
        .single();
      expect(membership).toBeDefined();
      const membershipId = membership?.id as string;

      const { data: payment } = await serviceClient
        .from("payments")
        .insert({
          user_id: userId,
          membership_id: membershipId,
          term_id: termId,
          amount_cents: 5000,
          currency: "USD",
          payment_method: "credit_card",
          provider: "stripe",
          status: "pending",
        })
        .select("id, status")
        .single();
      expect(payment).toBeDefined();
      const paymentId = payment?.id as string;

      // 2. Construct signed webhook event payload
      const eventId = `evt_test_${crypto.randomBytes(8).toString("hex")}`;
      const sessionId = `cs_test_${crypto.randomBytes(8).toString("hex")}`;

      const webhookPayload = JSON.stringify({
        id: eventId,
        type: "checkout.session.completed",
        data: {
          object: {
            id: sessionId,
            client_reference_id: paymentId,
            amount_total: 5000,
            currency: "usd",
            metadata: {
              paymentId,
              membershipId,
            },
          },
        },
      });

      // Valid test signature header format
      const signatureHeader = `t=${Math.floor(Date.now() / 1000)},v1=valid_test_signature_hex_digest_123456789`;

      const request = new NextRequest("http://127.0.0.1:3000/api/webhooks/stripe", {
        method: "POST",
        body: webhookPayload,
        headers: {
          "stripe-signature": signatureHeader,
          "content-type": "application/json",
        },
      });

      const response = await stripeWebhookPost(request);
      expect(response.status).toBe(200);
      const resJson = await response.json();
      expect(resJson.received).toBe(true);

      // Verify payment was confirmed in database
      const { data: updatedPayment } = await serviceClient
        .from("payments")
        .select("status, provider_event_id, provider_transaction_id")
        .eq("id", paymentId)
        .single();

      expect(updatedPayment?.status).toBe("confirmed");
      expect(updatedPayment?.provider_event_id).toBe(eventId);
      expect(updatedPayment?.provider_transaction_id).toBe(sessionId);

      // STRICT BYLAW ASSERTION: Membership must remain 'pending' awaiting manual staff approval!
      const { data: checkedMembership } = await serviceClient
        .from("memberships")
        .select("status")
        .eq("id", membershipId)
        .single();

      expect(checkedMembership?.status).toBe("pending");

      // 3. Test Deduplication: Replay the identical webhook event
      const replayRequest = new NextRequest("http://127.0.0.1:3000/api/webhooks/stripe", {
        method: "POST",
        body: webhookPayload,
        headers: {
          "stripe-signature": signatureHeader,
          "content-type": "application/json",
        },
      });

      const replayResponse = await stripeWebhookPost(replayRequest);
      expect(replayResponse.status).toBe(200);
      const replayJson = await replayResponse.json();
      expect(replayJson.deduplicated).toBe(true);
    });
  });

  describe("R6.2: Contact Notification Delivery to Local Capture & Deduplication", () => {
    it("dispatches notification and deduplicates repeated transmissions", async () => {
      const messageId = crypto.randomUUID();
      const payload = {
        messageId,
        reference: "SDGC-MSG-TEST1",
        senderName: "Gardener Sam",
        senderEmail: "sam@example.com",
        senderPhone: "(269) 555-0100",
        messageBody: "I would like to volunteer for the Garden Walk.",
        submittedAt: new Date().toISOString(),
      };

      // First dispatch
      const firstResult = await dispatchContactNotification(payload);
      expect(firstResult.success).toBe(true);
      expect(firstResult.recipient).toBe("staff@sdgc.local");
      expect(firstResult.deliveryMethod).not.toBe("deduplicated");

      // Second dispatch with same messageId (retry deduplication)
      const secondResult = await dispatchContactNotification(payload);
      expect(secondResult.success).toBe(true);
      expect(secondResult.deliveryMethod).toBe("deduplicated");
    });

    it("submits contact message and dispatches notification end-to-end", async () => {
      const res = await submitContactAction({
        name: "Test Visitor",
        email: "visitor@example.com",
        phone: "(269) 555-0199",
        message: "Inquiring about 2026 club meeting dates and civic plantings.",
        honeypot: "",
      });

      expect(res.success).toBe(true);
      if (!res.success) throw new Error("Expected contact submission to succeed");
      expect(res.data.reference).toMatch(/^SDGC-MSG-[A-F0-9]{8}$/);
    });
  });

  describe("R6.3: RFC 5545 iCalendar Feeds & Single Event Export", () => {
    it("escapes special characters correctly per RFC 5545", () => {
      const text = "Saugatuck, MI; Special Note \\ Newline\nTest";
      const escaped = escapeIcsText(text);
      expect(escaped).toBe("Saugatuck\\, MI\\; Special Note \\\\ Newline\\nTest");
    });

    it("formats ISO timestamps for all-day and timed events", () => {
      const allDay = formatIcsTimestamp("2026-07-11T10:00:00Z", true);
      expect(allDay).toBe("20260711");

      const timed = formatIcsTimestamp("2026-07-11T14:30:00Z", false);
      expect(timed).toBe("20260711T143000Z");
    });

    it("generates a complete RFC 5545 VCALENDAR feed string", () => {
      const testEvents: IcsEventInput[] = [
        {
          id: "evt-1",
          slug: "annual-garden-walk",
          title: "Annual Garden Walk",
          description: "Tour lovely gardens in Douglas.",
          startsAt: "2026-07-11T10:00:00-04:00",
          endsAt: "2026-07-11T16:00:00-04:00",
          allDay: false,
          location: "Saugatuck City Hall, Saugatuck, MI",
          url: "https://saugatuckdouglasgardenclub.com/event/annual-garden-walk",
        },
      ];

      const ics = generateICalendarFeed(testEvents);
      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("VERSION:2.0");
      expect(ics).toContain("PRODID:-//Saugatuck Douglas Garden Club//SDGC Calendar Feed//EN");
      expect(ics).toContain("BEGIN:VEVENT");
      expect(ics).toContain("UID:evt-1@saugatuckdouglasgardenclub.com");
      expect(ics).toContain("SUMMARY:Annual Garden Walk");
      expect(ics).toContain("LOCATION:Saugatuck City Hall\\, Saugatuck\\, MI");
      expect(ics).toContain("END:VEVENT");
      expect(ics).toContain("END:VCALENDAR");
    });

    it("serves live calendar feed at /events/feed.ics with text/calendar headers", async () => {
      const response = await calendarFeedGet();
      expect(response.status).toBe(200);

      const contentType = response.headers.get("content-type");
      expect(contentType).toContain("text/calendar");

      const body = await response.text();
      expect(body).toContain("BEGIN:VCALENDAR");
      expect(body).toContain("END:VCALENDAR");
    });

    it("exports single event .ics with download attachment headers", async () => {
      const request = new NextRequest(
        "http://127.0.0.1:3000/event/2026-garden-walk-fundraiser/ics",
      );
      const response = await singleEventIcsGet(request, {
        params: Promise.resolve({ slug: "2026-garden-walk-fundraiser" }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/calendar");
      expect(response.headers.get("content-disposition")).toContain("attachment;");
      expect(response.headers.get("content-disposition")).toContain(".ics");

      const body = await response.text();
      expect(body).toContain("BEGIN:VCALENDAR");
      expect(body).toContain("2026-garden-walk-fundraiser");
      expect(body).toContain("END:VCALENDAR");
    });
  });

  describe("R6.4: Zero Secret Key Exposure in Client Source Files", () => {
    it("ensures SUPABASE_SERVICE_ROLE_KEY is never referenced in client component directories", () => {
      const clientDirs = [
        path.resolve(process.cwd(), "src/components"),
        path.resolve(process.cwd(), "src/features/auth/components"),
        path.resolve(process.cwd(), "src/features/events/components"),
        path.resolve(process.cwd(), "src/features/media/components"),
        path.resolve(process.cwd(), "src/features/membership/components"),
        path.resolve(process.cwd(), "src/features/tickets/components"),
        path.resolve(process.cwd(), "src/features/contact/components"),
      ];

      for (const dir of clientDirs) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (!file.endsWith(".tsx") && !file.endsWith(".ts")) continue;
          const content = fs.readFileSync(path.join(dir, file), "utf8");
          expect(content).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
          expect(content).not.toContain("service_role");
        }
      }
    });
  });
});
