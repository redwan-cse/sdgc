import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripePaymentProvider } from "@/features/payments/stripe-provider";

export async function POST(request: NextRequest) {
  const signatureHeader = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  // 1. Verify webhook signature
  const isValid = stripePaymentProvider.verifyWebhookSignature(rawBody, signatureHeader);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: {
    id: string;
    type: string;
    data: {
      object: {
        id: string;
        client_reference_id?: string;
        payment_intent?: string;
        payment_status?: string;
        amount_total?: number;
        currency?: string;
        metadata?: Record<string, string>;
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed webhook payload" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 2. Event Deduplication: Prevent duplicate replay of already processed events
  const { data: existingProcessed } = await supabase
    .from("payments")
    .select("id, status")
    .eq("provider_event_id", event.id)
    .maybeSingle();

  if (existingProcessed) {
    return NextResponse.json({
      received: true,
      deduplicated: true,
      message: `Event ${event.id} already processed. Skipping duplicate execution.`,
    });
  }

  const sessionObj = event.data?.object;

  // 3. Process supported events
  switch (event.type) {
    case "checkout.session.completed": {
      // Must be confirmed paid by provider
      if (sessionObj?.payment_status && sessionObj.payment_status !== "paid") {
        return NextResponse.json(
          { error: `Payment not completed: status is ${sessionObj.payment_status}` },
          { status: 400 },
        );
      }

      const paymentId = sessionObj?.client_reference_id || sessionObj?.metadata?.paymentId;

      if (!paymentId) {
        return NextResponse.json(
          { error: "Missing payment reference identifier" },
          { status: 400 },
        );
      }

      // Fetch expected payment record
      const { data: payment, error: fetchError } = await supabase
        .from("payments")
        .select("id, status, amount_cents, currency")
        .eq("id", paymentId)
        .maybeSingle();

      if (fetchError || !payment) {
        return NextResponse.json({ error: "Expected payment record not found" }, { status: 404 });
      }

      // Already confirmed under another event
      if (payment.status === "confirmed") {
        return NextResponse.json({
          received: true,
          deduplicated: true,
          message: "Payment already confirmed.",
        });
      }

      if (payment.status !== "pending") {
        return NextResponse.json(
          { error: `Cannot transition payment from ${payment.status} to confirmed` },
          { status: 400 },
        );
      }

      // Authoritative validation of amount and currency
      if (
        typeof sessionObj.amount_total === "number" &&
        sessionObj.amount_total !== payment.amount_cents
      ) {
        return NextResponse.json(
          {
            error: `Payment amount mismatch: expected ${payment.amount_cents}, received ${sessionObj.amount_total}`,
          },
          { status: 400 },
        );
      }

      if (
        sessionObj.currency &&
        sessionObj.currency.toLowerCase() !== payment.currency.toLowerCase()
      ) {
        return NextResponse.json(
          {
            error: `Payment currency mismatch: expected ${payment.currency}, received ${sessionObj.currency}`,
          },
          { status: 400 },
        );
      }

      const providerTxId = sessionObj.payment_intent || sessionObj.id;

      // Atomic state transition guard: only update if status is still pending
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "confirmed",
          provider_event_id: event.id,
          provider_session_id: sessionObj.id,
          provider_transaction_id: providerTxId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId)
        .eq("status", "pending");

      if (updateError) {
        return NextResponse.json(
          { error: `Database update failed: ${updateError.message}` },
          { status: 500 },
        );
      }

      // Audit log
      await supabase.from("audit_events").insert({
        action: "payment.confirmed",
        entity_type: "payment",
        entity_id: paymentId,
        details: {
          event_id: event.id,
          provider: "stripe",
          provider_session_id: sessionObj.id,
          provider_transaction_id: providerTxId,
          amount_total: sessionObj.amount_total,
          currency: sessionObj.currency,
        },
      });

      // STRICT BYLAW REQUIREMENT: Membership status is NOT automatically approved!
      // It remains 'pending' awaiting manual staff approval.
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntentId = sessionObj?.id;
      if (paymentIntentId) {
        const { error: failError } = await supabase
          .from("payments")
          .update({
            status: "failed",
            provider_event_id: event.id,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_transaction_id", paymentIntentId)
          .eq("status", "pending");

        if (failError) {
          return NextResponse.json(
            { error: `Failed payment update error: ${failError.message}` },
            { status: 500 },
          );
        }
      }
      break;
    }

    case "charge.refunded": {
      const chargeId = sessionObj?.id;
      const txId = sessionObj?.payment_intent || chargeId;
      if (txId) {
        const { error: refundError } = await supabase
          .from("payments")
          .update({
            status: "refunded",
            provider_event_id: event.id,
            updated_at: new Date().toISOString(),
          })
          .or(`provider_transaction_id.eq.${txId},provider_session_id.eq.${txId}`)
          .eq("status", "confirmed");

        if (refundError) {
          return NextResponse.json(
            { error: `Refund update error: ${refundError.message}` },
            { status: 500 },
          );
        }
      }
      break;
    }

    default:
      // Ignore unhandled event types with 200 OK
      break;
  }

  return NextResponse.json({ received: true });
}
