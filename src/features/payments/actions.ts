"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/authorization";
import type { ActionResult } from "@/features/auth/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InitiateDuesInput, InitiateDuesResult } from "./types";
import { localPaymentProvider } from "./local-provider";

import { getMembershipYear } from "@/features/membership/rules";

export async function initiateDuesPaymentAction(
  input: InitiateDuesInput,
): Promise<ActionResult<InitiateDuesResult>> {
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
      provider: isCard ? "simulated" : "check",
      notes: isCard
        ? "Online card checkout via local simulated test adapter"
        : "Check to be mailed to P.O. Box 1011, Douglas, MI 49406",
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

  if (isCard) {
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
    },
  };
}
