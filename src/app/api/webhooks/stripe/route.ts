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
      const paymentId = sessionObj?.client_reference_id || sessionObj?.metadata?.paymentId;

      if (paymentId) {
        // Confirm payment record
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            status: "confirmed",
            provider_event_id: event.id,
            provider_transaction_id: sessionObj.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentId);

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
            provider_transaction_id: sessionObj.id,
            amount_total: sessionObj.amount_total,
            currency: sessionObj.currency,
          },
        });

        // STRICT BYLAW REQUIREMENT: Membership status is NOT automatically approved!
        // It remains 'pending' awaiting manual staff approval.
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntentId = sessionObj?.id;
      if (paymentIntentId) {
        await supabase
          .from("payments")
          .update({
            status: "failed",
            provider_event_id: event.id,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_transaction_id", paymentIntentId);
      }
      break;
    }

    case "charge.refunded": {
      const chargeId = sessionObj?.id;
      if (chargeId) {
        await supabase
          .from("payments")
          .update({
            status: "refunded",
            provider_event_id: event.id,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_transaction_id", chargeId);
      }
      break;
    }

    default:
      // Ignore unhandled event types with 200 OK
      break;
  }

  return NextResponse.json({ received: true });
}
