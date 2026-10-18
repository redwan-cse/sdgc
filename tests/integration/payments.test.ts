import { describe, it, expect, beforeAll } from "vitest";
import { createAnonClient, createServiceClient, createAuthClient } from "./setup";
import { submitContactAction } from "@/features/contact/actions";

describe("Payments & Dues Workflows (Integration)", () => {
  let memberClient: Awaited<ReturnType<typeof createAuthClient>>;
  let pendingClient: Awaited<ReturnType<typeof createAuthClient>>;
  let treasurerClient: Awaited<ReturnType<typeof createAuthClient>>;
  let serviceClient: ReturnType<typeof createServiceClient>;
  let anonClient: ReturnType<typeof createAnonClient>;

  beforeAll(async () => {
    anonClient = createAnonClient();
    serviceClient = createServiceClient();
    memberClient = await createAuthClient("member@sdgc.local");
    pendingClient = await createAuthClient("pending@sdgc.local");
    treasurerClient = await createAuthClient("treasurer@sdgc.local");
  });

  it("denies anonymous users from reading the payments table", async () => {
    const { data, error } = await anonClient.from("payments").select("*");
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("denies anonymous users from inserting payments", async () => {
    // 1. Fetch valid term and membership
    const { data: term } = await serviceClient
      .from("membership_terms")
      .select("id")
      .eq("year", 2026)
      .single();
    const { data: mem } = await serviceClient
      .from("memberships")
      .select("id, user_id")
      .limit(1)
      .single();

    const { error } = await anonClient.from("payments").insert({
      user_id: mem?.user_id || memberClient.userId,
      membership_id: mem?.id || crypto.randomUUID(),
      term_id: term?.id || crypto.randomUUID(),
      amount_cents: 5000,
      currency: "USD",
      payment_method: "credit_card",
      status: "confirmed",
    });
    expect(error).not.toBeNull();
    expect(
      error?.code === "42501" ||
        /violates row-level security|permission denied/i.test(error?.message || ""),
    ).toBe(true);
  });

  it("allows member to view only their own payment records", async () => {
    const { data: memberPayments } = await memberClient.client
      .from("payments")
      .select("*")
      .eq("user_id", memberClient.userId);

    expect(memberPayments).toBeDefined();

    // Member attempting to select all records should not see other members' payments
    const { data: allPayments } = await memberClient.client.from("payments").select("*");
    for (const p of allPayments ?? []) {
      expect(p.user_id).toBe(memberClient.userId);
    }
  });

  it("prohibits a normal member from updating a payment to confirmed (RLS update check)", async () => {
    // 1. Fetch current 2026 term
    const { data: term } = await serviceClient
      .from("membership_terms")
      .select("id")
      .eq("year", 2026)
      .single();
    expect(term).toBeDefined();
    if (!term) return;

    // 2. Fetch or create membership for member
    const { data: membership } = await serviceClient
      .from("memberships")
      .select("id")
      .eq("user_id", memberClient.userId)
      .eq("term_id", term.id)
      .single();
    expect(membership).toBeDefined();
    if (!membership) return;

    // 3. Insert a pending payment using member client
    const { data: newPayment, error: insertError } = await memberClient.client
      .from("payments")
      .insert({
        user_id: memberClient.userId,
        membership_id: membership.id,
        term_id: term.id,
        amount_cents: 5000,
        currency: "USD",
        payment_method: "check",
        status: "pending",
      })
      .select()
      .single();

    expect(insertError).toBeNull();
    expect(newPayment).toBeDefined();
    expect(newPayment?.status).toBe("pending");
    if (!newPayment) return;

    // 4. Attempt to self-confirm payment as member
    const { data: updatedRows } = await memberClient.client
      .from("payments")
      .update({ status: "confirmed" })
      .eq("id", newPayment.id)
      .select();

    // RLS policy payments_update_treasurer restricts update to dues.reconcile capability, so 0 rows updated
    expect(updatedRows === null || updatedRows.length === 0).toBe(true);

    // Verify status remained pending in database
    const { data: unchangedPayment } = await serviceClient
      .from("payments")
      .select("status")
      .eq("id", newPayment.id)
      .single();

    expect(unchangedPayment?.status).toBe("pending");
  });

  it("allows treasurer to reconcile and confirm a payment, leaving membership pending approval", async () => {
    // 1. Fetch current 2026 term
    const { data: term } = await serviceClient
      .from("membership_terms")
      .select("id")
      .eq("year", 2026)
      .single();
    expect(term).toBeDefined();
    if (!term) return;

    const { data: membership } = await serviceClient
      .from("memberships")
      .select("id, status")
      .eq("user_id", pendingClient.userId)
      .eq("term_id", term.id)
      .single();

    expect(membership).toBeDefined();
    expect(membership?.status).toBe("pending");
    if (!membership) return;

    // 2. Create a pending check payment for the pending member
    const { data: payment } = await serviceClient
      .from("payments")
      .insert({
        user_id: pendingClient.userId,
        membership_id: membership.id,
        term_id: term.id,
        amount_cents: 5000,
        currency: "USD",
        payment_method: "check",
        status: "pending",
      })
      .select()
      .single();

    expect(payment).toBeDefined();
    if (!payment) return;

    // 3. Treasurer reconciles payment to confirmed
    const { error: reconcileError } = await treasurerClient.client
      .from("payments")
      .update({
        status: "confirmed",
        reconciled_by: treasurerClient.userId,
        reconciled_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    expect(reconcileError).toBeNull();

    // Verify payment is confirmed
    const { data: confirmedPayment } = await serviceClient
      .from("payments")
      .select("status, reconciled_by")
      .eq("id", payment.id)
      .single();

    expect(confirmedPayment?.status).toBe("confirmed");
    expect(confirmedPayment?.reconciled_by).toBe(treasurerClient.userId);

    // 4. CRITICAL: Verify membership remains pending (NOT auto-activated)
    const { data: verifiedMembership } = await serviceClient
      .from("memberships")
      .select("status")
      .eq("id", membership.id)
      .single();

    expect(verifiedMembership?.status).toBe("pending");
  });

  it("verifies direct contact insertion is denied but server action succeeds, and contact inbox reading is denied to non-staff", async () => {
    // 1. Direct table insert is denied to anon (Work Package R1.3)
    const { error: insertError } = await anonClient.from("contact_messages").insert({
      name: "Public Inquirer",
      email: "visitor@example.com",
      message: "Can you provide more information about the 2026 Garden Walk tour schedule?",
    });
    expect(insertError).not.toBeNull();
    expect(insertError?.code).toBe("42501");

    // 2. Server action submission succeeds
    const actionResult = await submitContactAction({
      name: "Public Inquirer",
      email: "visitor@example.com",
      message: "Can you provide more information about the 2026 Garden Walk tour schedule?",
    });
    expect(actionResult.success).toBe(true);

    // 3. Anon cannot read contact inbox (table grant denied)
    const { data: anonMessages, error: selectError } = await anonClient
      .from("contact_messages")
      .select("*");
    expect(selectError).not.toBeNull();
    expect(anonMessages).toBeNull();

    // 4. Member cannot read contact inbox (RLS policy filters out all rows)
    const { data: memberMessages } = await memberClient.client.from("contact_messages").select("*");
    expect(memberMessages?.length ?? 0).toBe(0);
  });

  it("rejects manual reconciliation on electronic credit card payments", async () => {
    // 1. Fetch 2026 term
    const { data: term } = await serviceClient
      .from("membership_terms")
      .select("id")
      .eq("year", 2026)
      .single();
    expect(term).toBeDefined();
    if (!term) return;

    // 2. Fetch membership for member
    const { data: mem } = await serviceClient
      .from("memberships")
      .select("id, user_id")
      .eq("user_id", memberClient.userId)
      .limit(1)
      .single();
    expect(mem).toBeDefined();
    if (!mem) return;

    // 3. Create a pending credit card payment
    const { data: cardPayment, error: createError } = await serviceClient
      .from("payments")
      .insert({
        user_id: memberClient.userId,
        membership_id: mem.id,
        term_id: term.id,
        amount_cents: 5000,
        currency: "USD",
        payment_method: "credit_card",
        status: "pending",
      })
      .select("id")
      .single();

    expect(createError).toBeNull();
    expect(cardPayment).toBeDefined();
    if (!cardPayment) return;

    // 4. Treasurer attempts manual reconciliation -> must be rejected by reconcile_payment RPC
    const { data: reconcileResult, error: rpcError } = await treasurerClient.client.rpc(
      "reconcile_payment",
      {
        p_payment_id: cardPayment.id,
        p_notes: "Attempting manual reconciliation on card",
      },
    );

    expect(rpcError).toBeNull();
    const res = reconcileResult as { success: boolean; error?: string };
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Only paper-check payments can be manually reconciled/i);

    // Clean up test payment
    await serviceClient.from("payments").delete().eq("id", cardPayment.id);
  });
});
