"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/authorization";
import type { ActionResult } from "@/features/auth/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InitiateDuesInput, InitiateDuesResult } from "./types";
import { localPaymentProvider } from "./local-provider";
import { stripePaymentProvider } from "./stripe-provider";

import { getMembershipYear } from "@/features/membership/rules";

export async function initiateDuesPaymentAction(
  input: InitiateDuesInput,
): Promise<ActionResult<InitiateDuesResult>> {
  try {
    // 1. Authorize user server identity
    const user = await requireUser("/membership");
    const targetYear = input.termYear ?? getMembershipYear(new Date(), "America/Detroit");

    if (input.method !== "credit_card" && input.method !== "check") {
      return {
        success: false,
        error: "Invalid payment method selected. Must be credit_card or check.",
      };
    }

    const supabase = await createClient();

    // 2. Fetch authoritative term rate and dates from database (never trust client amounts)
    const { data: term, error: termError } = await supabase
      .from("membership_terms")
      .select("id, year, dues_cents, currency, opens_at, closes_at")
      .eq("year", targetYear)
      .maybeSingle();

    if (termError || !term) {
      return {
        success: false,
        error: `Membership term for year ${targetYear} is not currently configured.`,
      };
    }

    // 3. Find or create user's membership row for this term
    let membershipId: string;
    const { data: existingMembership } = await supabase
      .from("memberships")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("term_id", term.id)
      .maybeSingle();

    if (existingMembership) {
      membershipId = existingMembership.id;
    } else {
      const { data: newMembership, error: membershipError } = await supabase
        .from("memberships")
        .insert({
          user_id: user.id,
          term_id: term.id,
          status: "pending",
        })
        .select("id")
        .single();

      if (membershipError || !newMembership) {
        return {
          success: false,
          error: `Could not initialize membership: ${membershipError?.message ?? "unknown error"}`,
        };
      }
      membershipId = newMembership.id;
    }

    // 4. Check for already confirmed payments to prevent duplicate payments
    const { data: existingConfirmedPayment } = await supabase
      .from("payments")
      .select("id, status")
      .eq("membership_id", membershipId)
      .eq("status", "confirmed")
      .maybeSingle();

    if (existingConfirmedPayment) {
      return {
        success: false,
        error: `Annual dues for calendar year ${targetYear} have already been paid and confirmed.`,
      };
    }

    // 5. Insert initial payment record as 'pending'
    const isCard = input.method === "credit_card";
    const isSimulation = process.env.LOCAL_PAYMENTS_SIMULATION === "true";
    const stripeStatus = stripePaymentProvider.getConfigStatus();

    const providerName = isCard ? (isSimulation ? "simulated" : "stripe") : "check";
    const notesText = isCard
      ? isSimulation
        ? "Online card checkout via local simulated test adapter"
        : "Online card checkout via Stripe Checkout"
      : "Check to be mailed to P.O. Box 1011, Douglas, MI 49406";

    const { data: newPayment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        membership_id: membershipId,
        term_id: term.id,
        amount_cents: term.dues_cents, // Authoritative rate from database: $50.00 (5000 cents)
        currency: "USD",
        payment_method: input.method,
        status: "pending",
        provider: providerName,
        notes: notesText,
      })
      .select("id")
      .single();

    if (paymentError || !newPayment) {
      return {
        success: false,
        error: `Failed to record payment intent: ${paymentError?.message ?? "unknown error"}`,
      };
    }

    // 6. Handle payment flow
    let finalStatus: "pending" | "confirmed" = "pending";
    let message: string;
    let checkoutUrl: string | undefined;

    if (isCard) {
      if (isSimulation) {
        // Local simulation: confirm payment via server admin client (simulating webhook execution)
        const checkout = await localPaymentProvider.createCheckout({
          paymentId: newPayment.id,
          amountCents: term.dues_cents,
          currency: "USD",
          returnPath: "/membership",
          membershipId,
        });

        const admin = createAdminClient();
        const { error: confirmError } = await admin
          .from("payments")
          .update({
            status: "confirmed",
            provider_transaction_id: checkout.providerReference,
            provider_event_id: `evt_${checkout.providerReference}`,
          })
          .eq("id", newPayment.id);

        if (confirmError) {
          return {
            success: false,
            error: `Failed to confirm simulated transaction: ${confirmError.message}`,
          };
        }

        finalStatus = "confirmed";
        const formattedAmount = `$${(term.dues_cents / 100).toFixed(2)} ${term.currency}`;
        // CRITICAL: We intentionally do NOT change membership status to approved!
        // Club bylaws mandate that online payment confirmation leaves membership pending manual staff approval.
        message = `Payment Simulation: Card payment of ${formattedAmount} recorded as CONFIRMED. As required by club bylaws, your membership remains PENDING manual approval by staff.`;
      } else if (stripeStatus.isConfigured) {
        // Production or Sandbox Stripe Checkout Session
        const checkout = await stripePaymentProvider.createCheckoutSession({
          paymentId: newPayment.id,
          amountCents: term.dues_cents,
          currency: "USD",
          returnPath: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/membership`,
          membershipId,
          termYear: targetYear,
          userId: user.id,
          customerEmail: user.email,
        });

        const admin = createAdminClient();
        await admin
          .from("payments")
          .update({
            provider: "stripe",
            provider_transaction_id: checkout.providerReference,
          })
          .eq("id", newPayment.id);

        finalStatus = "pending";
        checkoutUrl = checkout.checkoutUrl;
        message = "Redirecting to secure Stripe Checkout...";
      } else {
        return {
          success: false,
          error:
            "Online card payments are currently being configured. Please select 'Check' or contact the club treasurer.",
        };
      }
    } else {
      const formattedAmount = `$${(term.dues_cents / 100).toFixed(2)} ${term.currency}`;
      // Paper check mailing instructions
      message = `Check Instructions: Please mail your ${formattedAmount} check payable to 'SDGC' to P.O. Box 1011, Douglas, MI 49406. Staff will reconcile your check upon receipt and activate your membership.`;
    }

    revalidatePath("/membership");
    revalidatePath("/profile");

    return {
      success: true,
      data: {
        paymentId: newPayment.id,
        status: finalStatus,
        method: input.method,
        amountCents: term.dues_cents,
        message,
        checkoutUrl,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Payment initialization failed",
    };
  }
}
