import { describe, expect, it } from "vitest";
import { createAuthClient, createServiceClient, getLocalFixtures } from "./setup";

describe("Phase 1: Member Data Privacy, Notes Persistence & State Guards", () => {
  const fixtures = getLocalFixtures();
  const serviceClient = createServiceClient();

  it("preserves directory_opt_out when admin performs a partial profile update", async () => {
    const { client: adminClient } = await createAuthClient("admin@sdgc.local");

    // 1. Create a test user with directory_opt_out = true
    const testEmail = `privacy_test_${Date.now()}@sdgc.local`;
    const { data: userData, error: userErr } = await serviceClient.auth.admin.createUser({
      email: testEmail,
      password: "Password123!",
      email_confirm: true,
      user_metadata: {
        username: `priv_${Date.now()}`,
        first_name: "Privacy",
        last_name: "Preserved",
        directory_opt_out: true,
      },
    });
    expect(userErr).toBeNull();
    if (!userData.user) throw new Error("Expected user to be created");
    const testUserId = userData.user.id;

    // Explicitly verify profile has directory_opt_out = true
    await serviceClient
      .from("profiles")
      .update({ directory_opt_out: true, secondary_phone: "269-555-9999" })
      .eq("id", testUserId);

    const { data: beforeProfile } = await serviceClient
      .from("profiles")
      .select("directory_opt_out, secondary_phone")
      .eq("id", testUserId)
      .single();
    expect(beforeProfile?.directory_opt_out).toBe(true);
    expect(beforeProfile?.secondary_phone).toBe("269-555-9999");

    // 2. Admin updates ONLY first name and address (omitting directory_opt_out and secondary_phone)
    const { error: rpcErr } = await adminClient.rpc("admin_update_member_profile", {
      target_user_id: testUserId,
      p_first_name: "PrivacyUpdated",
      p_address_line1: "123 Safe St",
      p_notes: "Staff note regarding committee interest",
    });
    expect(rpcErr).toBeNull();

    // 3. Verify directory_opt_out is STILL true, secondary_phone is preserved, and notes are saved
    const { data: afterProfile } = await serviceClient
      .from("profiles")
      .select("first_name, address_line1, directory_opt_out, secondary_phone, admin_notes")
      .eq("id", testUserId)
      .single();

    expect(afterProfile?.first_name).toBe("PrivacyUpdated");
    expect(afterProfile?.address_line1).toBe("123 Safe St");
    expect(afterProfile?.directory_opt_out).toBe(true);
    expect(afterProfile?.secondary_phone).toBe("269-555-9999");
    expect(afterProfile?.admin_notes).toBe("Staff note regarding committee interest");

    // Clean up
    await serviceClient.auth.admin.deleteUser(testUserId);
  });

  it("enforces that approval requires confirmed dues payment", async () => {
    const { client: adminClient } = await createAuthClient("admin@sdgc.local");

    // 1. Create a pending member without payment
    const testEmail = `unpaid_${Date.now()}@sdgc.local`;
    const { data: userData } = await serviceClient.auth.admin.createUser({
      email: testEmail,
      password: "Password123!",
      email_confirm: true,
      user_metadata: {
        username: `unpaid_${Date.now()}`,
        first_name: "Unpaid",
        last_name: "Applicant",
      },
    });
    if (!userData.user) throw new Error("Expected user to be created");
    const testUserId = userData.user.id;

    const { data: mem } = await serviceClient
      .from("memberships")
      .select("id, status, version, term_id")
      .eq("user_id", testUserId)
      .single();
    expect(mem?.status).toBe("pending");
    if (!mem) throw new Error("Expected membership record");

    // 2. Attempt approval without payment -> MUST FAIL
    const { data: failRes } = await adminClient.rpc("approve_membership", {
      p_membership_id: mem.id,
      p_expected_version: 1,
    });
    expect(failRes).toMatchObject({
      success: false,
      error: expect.stringContaining("dues payment must be confirmed"),
    });

    // 3. Admin can approve with explicit audited waiver
    const { data: waivedRes } = await adminClient.rpc("approve_membership", {
      p_membership_id: mem.id,
      p_expected_version: 1,
      p_waive_dues: true,
      p_waiver_reason: "Honorary lifetime board member",
    });
    expect(waivedRes).toMatchObject({
      success: true,
      new_version: 2,
    });

    const { data: approvedMem } = await serviceClient
      .from("memberships")
      .select("status, notes")
      .eq("id", mem.id)
      .single();
    expect(approvedMem?.status).toBe("approved");
    expect(approvedMem?.notes).toContain("Honorary lifetime board member");

    // Clean up
    await serviceClient.auth.admin.deleteUser(testUserId);
  });

  it("restricts reconcile_payment to pending check payments only", async () => {
    const { client: treasurerClient } = await createAuthClient("treasurer@sdgc.local");
    const memberUser = fixtures.personas["member@sdgc.local"];

    const { data: mem } = await serviceClient
      .from("memberships")
      .select("id, term_id")
      .eq("user_id", memberUser.id)
      .single();
    expect(mem).toBeDefined();
    if (!mem) throw new Error("Expected membership record");
    const membershipId = mem.id;
    const termId = mem.term_id;

    // 1. Insert a credit card payment (should NOT be reconcilable as paper check)
    const { data: cardPayment, error: cardInsertErr } = await serviceClient
      .from("payments")
      .insert({
        user_id: memberUser.id,
        membership_id: membershipId,
        term_id: termId,
        amount_cents: 5000,
        currency: "USD",
        payment_method: "credit_card",
        status: "pending",
      })
      .select("id")
      .single();
    expect(cardInsertErr).toBeNull();
    if (!cardPayment) throw new Error("Expected card payment");

    const { data: cardRes } = await treasurerClient.rpc("reconcile_payment", {
      p_payment_id: cardPayment.id,
    });
    expect(cardRes).toMatchObject({
      success: false,
      error: expect.stringContaining("Only paper-check payments can be manually reconciled"),
    });

    // 2. Insert a failed check payment (should NOT be reconcilable directly)
    const { data: failedCheck, error: failedInsertErr } = await serviceClient
      .from("payments")
      .insert({
        user_id: memberUser.id,
        membership_id: membershipId,
        term_id: termId,
        amount_cents: 5000,
        currency: "USD",
        payment_method: "check",
        status: "failed",
      })
      .select("id")
      .single();
    expect(failedInsertErr).toBeNull();
    if (!failedCheck) throw new Error("Expected failed check payment");

    const { data: failedRes } = await treasurerClient.rpc("reconcile_payment", {
      p_payment_id: failedCheck.id,
    });
    expect(failedRes).toMatchObject({
      success: false,
      error: expect.stringContaining("Only pending check payments can be reconciled"),
    });

    // 3. Insert a valid pending check payment -> should succeed
    const { data: validCheck, error: validInsertErr } = await serviceClient
      .from("payments")
      .insert({
        user_id: memberUser.id,
        membership_id: membershipId,
        term_id: termId,
        amount_cents: 5000,
        currency: "USD",
        payment_method: "check",
        status: "pending",
      })
      .select("id")
      .single();
    expect(validInsertErr).toBeNull();
    if (!validCheck) throw new Error("Expected valid check payment");

    const { data: validRes } = await treasurerClient.rpc("reconcile_payment", {
      p_payment_id: validCheck.id,
      p_notes: "Check #1042 deposited at Fifth Third Bank",
    });
    expect(validRes).toMatchObject({
      success: true,
    });

    const { data: reconciledPayment } = await serviceClient
      .from("payments")
      .select("status, notes")
      .eq("id", validCheck.id)
      .single();
    expect(reconciledPayment?.status).toBe("confirmed");
    expect(reconciledPayment?.notes).toBe("Check #1042 deposited at Fifth Third Bank");

    // Clean up test payments
    await serviceClient
      .from("payments")
      .delete()
      .in("id", [cardPayment.id, failedCheck.id, validCheck.id]);
  });
});
