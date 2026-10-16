import { describe, expect, it } from "vitest";
import { createAuthClient, createServiceClient } from "./setup";
import { getMembershipYear, isMembershipActive } from "@/features/membership/rules";

describe("R3: Annual Membership & Calendar Remediation Regression Suite", () => {
  const serviceClient = createServiceClient();

  describe("Dynamic Michigan Term Resolution & Dues Rates", () => {
    it("dynamically resolves current Michigan membership term and dues rate from database", async () => {
      const currentYear = getMembershipYear(new Date(), "America/Detroit");

      // Verify that the database contains an active term for this Michigan year
      const { data: term, error: termErr } = await serviceClient
        .from("membership_terms")
        .select("id, year, dues_cents, currency, opens_at, closes_at")
        .eq("year", currentYear)
        .single();

      expect(termErr).toBeNull();
      expect(term).toBeDefined();
      if (!term) throw new Error("Expected term to be defined");
      expect(term.year).toBe(currentYear);
      expect(term.dues_cents).toBeGreaterThan(0);
      expect(term.currency).toBe("USD");
      expect(new Date(term.opens_at).getTime()).toBeLessThanOrEqual(
        new Date(term.closes_at).getTime(),
      );
    });
  });

  describe("Distinct Membership State Preservation", () => {
    it("preserves distinct pending, approved, rejected, expired, and suspended statuses in database", async () => {
      const statuses = ["pending", "approved", "rejected", "expired", "suspended"] as const;

      for (const status of statuses) {
        // Create an isolated test user (auto-provisions pending membership via R2 trigger)
        const testEmail = `status_test_${status}_${Date.now()}@sdgc.local`;
        const { data: userData, error: userErr } = await serviceClient.auth.admin.createUser({
          email: testEmail,
          password: "Password123!",
          email_confirm: true,
          user_metadata: {
            username: `user_${status}_${Date.now()}`,
            first_name: "Status",
            last_name: "Tester",
          },
        });

        expect(userErr).toBeNull();
        if (!userData.user) throw new Error("Expected created user");
        const userId = userData.user.id;

        try {
          const { data: mem, error: updateErr } = await serviceClient
            .from("memberships")
            .update({ status })
            .eq("user_id", userId)
            .select("id, status")
            .single();

          expect(updateErr).toBeNull();
          expect(mem?.status).toBe(status);

          // Verify querying by status returns the updated row distinctly
          if (!mem) throw new Error("Expected membership record");
          const { data: queried } = await serviceClient
            .from("memberships")
            .select("status")
            .eq("id", mem.id)
            .single();

          expect(queried?.status).toBe(status);
        } finally {
          await serviceClient.auth.admin.deleteUser(userId);
        }
      }
    });

    it("evaluates isMembershipActive correctly across all 5 membership states", () => {
      const mid2026 = new Date("2026-07-15T12:00:00Z");

      // Approved & not suspended in current year
      expect(
        isMembershipActive(
          { approved: true, suspended: false, year: 2026, status: "approved" },
          mid2026,
        ),
      ).toBe(true);

      // Pending
      expect(
        isMembershipActive(
          { approved: false, suspended: false, year: 2026, status: "pending" },
          mid2026,
        ),
      ).toBe(false);

      // Suspended
      expect(
        isMembershipActive(
          { approved: true, suspended: true, year: 2026, status: "suspended" },
          mid2026,
        ),
      ).toBe(false);

      // Rejected
      expect(
        isMembershipActive(
          { approved: false, suspended: false, year: 2026, status: "rejected" },
          mid2026,
        ),
      ).toBe(false);

      // Expired (prior year or expired status)
      expect(
        isMembershipActive(
          { approved: true, suspended: false, year: 2025, status: "expired" },
          mid2026,
        ),
      ).toBe(false);
      expect(
        isMembershipActive(
          { approved: true, suspended: false, year: 2026, status: "expired" },
          mid2026,
        ),
      ).toBe(false);
    });
  });

  describe("Treasurer Persona Approval Capability vs Editor / Member Denial", () => {
    it("allows treasurer to approve pending membership via approve_membership RPC", async () => {
      const { client: treasurerClient, userId: treasurerId } =
        await createAuthClient("treasurer@sdgc.local");

      // Create an isolated test user (auto-provisions pending membership with version = 1)
      const testEmail = `treasurer_appr_${Date.now()}@sdgc.local`;
      const { data: userData, error: userErr } = await serviceClient.auth.admin.createUser({
        email: testEmail,
        password: "Password123!",
        email_confirm: true,
        user_metadata: {
          username: `tr_appr_${Date.now()}`,
          first_name: "Appr",
          last_name: "Candidate",
        },
      });

      expect(userErr).toBeNull();
      if (!userData.user) throw new Error("Expected user");
      const candidateUserId = userData.user.id;

      try {
        const { data: tempMem, error: memErr } = await serviceClient
          .from("memberships")
          .select("id, status, version")
          .eq("user_id", candidateUserId)
          .single();

        expect(memErr).toBeNull();
        expect(tempMem).toBeDefined();
        if (!tempMem) throw new Error("Expected tempMem");
        expect(tempMem.status).toBe("pending");
        expect(tempMem.version).toBe(1);

        const { data: approvalRes, error: approvalErr } = await treasurerClient.rpc(
          "approve_membership",
          {
            p_membership_id: tempMem.id,
            p_expected_version: 1,
          },
        );

        expect(approvalErr).toBeNull();
        expect(approvalRes).toMatchObject({
          success: true,
          new_version: 2,
        });

        // Verify status is approved and approved_by is treasurer
        const { data: updated } = await serviceClient
          .from("memberships")
          .select("status, version, approved_by")
          .eq("id", tempMem.id)
          .single();

        expect(updated?.status).toBe("approved");
        expect(updated?.version).toBe(2);
        expect(updated?.approved_by).toBe(treasurerId);
      } finally {
        await serviceClient.auth.admin.deleteUser(candidateUserId);
      }
    });

    it("denies editor from approving pending membership via approve_membership RPC", async () => {
      const { client: editorClient } = await createAuthClient("editor@sdgc.local");

      const testEmail = `editor_denied_${Date.now()}@sdgc.local`;
      const { data: userData, error: userErr } = await serviceClient.auth.admin.createUser({
        email: testEmail,
        password: "Password123!",
        email_confirm: true,
        user_metadata: {
          username: `ed_den_${Date.now()}`,
          first_name: "Denied",
          last_name: "Candidate",
        },
      });

      expect(userErr).toBeNull();
      if (!userData.user) throw new Error("Expected user");
      const candidateUserId = userData.user.id;

      try {
        const { data: tempMem } = await serviceClient
          .from("memberships")
          .select("id")
          .eq("user_id", candidateUserId)
          .single();

        if (!tempMem) throw new Error("Expected tempMem");

        const { error: approvalErr } = await editorClient.rpc("approve_membership", {
          p_membership_id: tempMem.id,
          p_expected_version: 1,
        });

        expect(approvalErr).not.toBeNull();
        expect(approvalErr?.message).toMatch(/Unauthorized to approve membership/i);
      } finally {
        await serviceClient.auth.admin.deleteUser(candidateUserId);
      }
    });

    it("denies regular member from approving pending membership via approve_membership RPC", async () => {
      const { client: memberClient } = await createAuthClient("member@sdgc.local");

      const testEmail = `member_denied_${Date.now()}@sdgc.local`;
      const { data: userData, error: userErr } = await serviceClient.auth.admin.createUser({
        email: testEmail,
        password: "Password123!",
        email_confirm: true,
        user_metadata: {
          username: `mem_den_${Date.now()}`,
          first_name: "Denied",
          last_name: "Candidate",
        },
      });

      expect(userErr).toBeNull();
      if (!userData.user) throw new Error("Expected user");
      const candidateUserId = userData.user.id;

      try {
        const { data: tempMem } = await serviceClient
          .from("memberships")
          .select("id")
          .eq("user_id", candidateUserId)
          .single();

        if (!tempMem) throw new Error("Expected tempMem");

        const { error: approvalErr } = await memberClient.rpc("approve_membership", {
          p_membership_id: tempMem.id,
          p_expected_version: 1,
        });

        expect(approvalErr).not.toBeNull();
        expect(approvalErr?.message).toMatch(/Unauthorized to approve membership/i);
      } finally {
        await serviceClient.auth.admin.deleteUser(candidateUserId);
      }
    });
  });

  describe("Optimistic Concurrency Control on Membership Approval", () => {
    it("fails with Stale version conflict when expectedVersion does not match current version", async () => {
      const { client: adminClient } = await createAuthClient("admin@sdgc.local");

      const testEmail = `occ_test_${Date.now()}@sdgc.local`;
      const { data: userData, error: userErr } = await serviceClient.auth.admin.createUser({
        email: testEmail,
        password: "Password123!",
        email_confirm: true,
        user_metadata: {
          username: `occ_${Date.now()}`,
          first_name: "OCC",
          last_name: "Tester",
        },
      });

      expect(userErr).toBeNull();
      if (!userData.user) throw new Error("Expected user");
      const candidateUserId = userData.user.id;

      try {
        const { data: tempMem } = await serviceClient
          .from("memberships")
          .update({ version: 5 })
          .eq("user_id", candidateUserId)
          .select("id")
          .single();

        if (!tempMem) throw new Error("Expected tempMem");

        const { data: conflictRes, error: conflictErr } = await adminClient.rpc(
          "approve_membership",
          {
            p_membership_id: tempMem.id,
            p_expected_version: 4, // Intentionally wrong version (5 != 4)
          },
        );

        expect(conflictErr).toBeNull();
        expect(conflictRes).toMatchObject({
          success: false,
          error: "Stale version conflict",
        });
      } finally {
        await serviceClient.auth.admin.deleteUser(candidateUserId);
      }
    });
  });
});
