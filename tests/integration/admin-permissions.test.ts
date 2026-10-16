import { describe, expect, it } from "vitest";
import { createAnonClient, createAuthClient, createServiceClient, getLocalFixtures } from "./setup";

describe("Phase P6: Administrator Operations, Directory RLS & RBAC Matrix", () => {
  const fixtures = getLocalFixtures();
  const anonClient = createAnonClient();
  const serviceClient = createServiceClient();

  describe("RBAC Capabilities Matrix (has_capability RPC)", () => {
    it("admin has all administrative capabilities", async () => {
      const { client, userId } = await createAuthClient("admin@sdgc.local");

      const capabilities = [
        "content.manage",
        "events.manage",
        "media.manage",
        "dues.reconcile",
        "members.manage",
        "messages.manage",
        "roles.manage",
      ];

      for (const cap of capabilities) {
        const { data, error } = await client.rpc("has_capability", {
          capability_name: cap,
          check_user_id: userId,
        });
        expect(error).toBeNull();
        expect(data).toBe(true);
      }
    });

    it("editor has content and event capabilities but cannot reconcile dues or manage roles", async () => {
      const { client, userId } = await createAuthClient("editor@sdgc.local");

      const allowed = ["content.manage", "events.manage", "media.manage"];
      for (const cap of allowed) {
        const { data, error } = await client.rpc("has_capability", {
          capability_name: cap,
          check_user_id: userId,
        });
        expect(error).toBeNull();
        expect(data).toBe(true);
      }

      const denied = ["dues.reconcile", "members.manage", "roles.manage", "messages.manage"];
      for (const cap of denied) {
        const { data, error } = await client.rpc("has_capability", {
          capability_name: cap,
          check_user_id: userId,
        });
        expect(error).toBeNull();
        expect(data).toBe(false);
      }
    });

    it("treasurer has dues reconciliation capabilities but cannot manage content or roles", async () => {
      const { client, userId } = await createAuthClient("treasurer@sdgc.local");

      const { data: canReconcile } = await client.rpc("has_capability", {
        capability_name: "dues.reconcile",
        check_user_id: userId,
      });
      expect(canReconcile).toBe(true);

      const denied = [
        "content.manage",
        "events.manage",
        "media.manage",
        "roles.manage",
        "messages.manage",
      ];
      for (const cap of denied) {
        const { data } = await client.rpc("has_capability", {
          capability_name: cap,
          check_user_id: userId,
        });
        expect(data).toBe(false);
      }
    });

    it("regular member has no staff capabilities and cannot read staff contact inbox", async () => {
      const { client, userId } = await createAuthClient("member@sdgc.local");

      const staffCaps = [
        "content.manage",
        "events.manage",
        "dues.reconcile",
        "members.manage",
        "roles.manage",
        "messages.manage",
      ];
      for (const cap of staffCaps) {
        const { data } = await client.rpc("has_capability", {
          capability_name: cap,
          check_user_id: userId,
        });
        expect(data).toBe(false);
      }

      // Member directly attempting to read staff inbox via RLS sees zero rows
      const { data: messages, error } = await client.from("contact_messages").select("*");
      expect(error).toBeNull();
      expect(messages).toEqual([]);
    });
  });

  describe("Member Directory Access Controls (RLS)", () => {
    it("denies anonymous access to profiles", async () => {
      const { data, error } = await anonClient.from("profiles").select("id, username");
      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });

    it("allows active approved members to select directory profiles", async () => {
      // member@sdgc.local is an approved active member in the seed data
      const { client } = await createAuthClient("member@sdgc.local");

      const { data: profiles, error } = await client
        .from("profiles")
        .select("id, username, first_name, last_name, directory_opt_out");

      expect(error).toBeNull();
      expect(profiles).toBeDefined();
      expect(profiles?.length).toBeGreaterThan(0);
    });

    it("hides profiles where directory_opt_out is true from other members", async () => {
      // Set an opt_out flag on one profile via service role
      const { data: targetProfile } = await serviceClient
        .from("profiles")
        .select("id")
        .eq("username", "treasurer_pat")
        .single();

      if (targetProfile) {
        await serviceClient
          .from("profiles")
          .update({ directory_opt_out: true })
          .eq("id", targetProfile.id);

        const { client } = await createAuthClient("member@sdgc.local");
        const { data: memberView } = await client
          .from("profiles")
          .select("id, username")
          .eq("id", targetProfile.id);

        // Member cannot see the opted-out profile
        expect(memberView).toEqual([]);

        // Reset directory_opt_out to false
        await serviceClient
          .from("profiles")
          .update({ directory_opt_out: false })
          .eq("id", targetProfile.id);
      }
    });
  });

  describe("Atomic Approval & Stale Version Concurrency", () => {
    it("rejects membership approval when caller lacks capability", async () => {
      const { client } = await createAuthClient("editor@sdgc.local");

      // Editor calls approve_membership
      const { error } = await client.rpc("approve_membership", {
        p_membership_id: fixtures.testMembershipId || "00000000-0000-0000-0000-000000000000",
        p_expected_version: 1,
      });

      // Should fail with unauthorized error
      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/Unauthorized/i);
    });

    it("rejects approval if expected version does not match current version (stale conflict)", async () => {
      const { client: adminClient } = await createAuthClient("admin@sdgc.local");

      // Create a test pending membership
      const { data: newMem } = await serviceClient
        .from("memberships")
        .insert({
          user_id: fixtures.memberUserId,
          term_id: fixtures.termId,
          status: "pending",
          version: 2,
        })
        .select("id")
        .single();

      if (newMem) {
        // Admin attempts approval with stale version (expected 1, actual 2)
        const { data: conflictRes, error: conflictErr } = await adminClient.rpc(
          "approve_membership",
          {
            p_membership_id: newMem.id,
            p_expected_version: 1,
          },
        );

        expect(conflictErr).toBeNull();
        expect(conflictRes).toMatchObject({
          success: false,
          error: "Stale version conflict",
        });

        // Clean up test membership
        await serviceClient.from("memberships").delete().eq("id", newMem.id);
      }
    });

    it("approves membership with correct version and creates audit log", async () => {
      const { client: adminClient } = await createAuthClient("admin@sdgc.local");

      // Create a temporary test pending membership
      const { data: tempMem } = await serviceClient
        .from("memberships")
        .insert({
          user_id: fixtures.memberUserId,
          term_id: fixtures.termId,
          status: "pending",
          version: 1,
        })
        .select("id")
        .single();

      if (tempMem) {
        const { data: approvalRes, error: approvalErr } = await adminClient.rpc(
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

        // Check updated status in DB
        const { data: updated } = await serviceClient
          .from("memberships")
          .select("status, version, approved_by")
          .eq("id", tempMem.id)
          .single();

        expect(updated?.status).toBe("approved");
        expect(updated?.version).toBe(2);
        expect(updated?.approved_by).toBe(fixtures.adminUserId);

        // Check audit event
        const { data: audit } = await serviceClient
          .from("audit_events")
          .select("action, entity_id")
          .eq("action", "membership.approved")
          .eq("entity_id", tempMem.id)
          .single();

        expect(audit).toBeDefined();

        // Clean up
        await serviceClient.from("memberships").delete().eq("id", tempMem.id);
      }
    });
  });

  describe("Last-Administrator Protection Trigger", () => {
    it("database trigger blocks removing the last admin role", async () => {
      // Find the admin user role row
      const { data: adminRoles } = await serviceClient
        .from("user_roles")
        .select("user_id, role")
        .eq("role", "admin");

      expect(adminRoles?.length).toBe(1);

      if (adminRoles && adminRoles.length === 1 && adminRoles[0]?.user_id) {
        const targetAdminId = adminRoles[0].user_id;

        // Attempting to delete the last admin role must throw exception
        const { error: deleteErr } = await serviceClient
          .from("user_roles")
          .delete()
          .eq("user_id", targetAdminId)
          .eq("role", "admin");

        expect(deleteErr).not.toBeNull();
        expect(deleteErr?.message).toMatch(/Cannot remove the last administrator/i);

        // Verify the admin role is still preserved
        const { data: preserved } = await serviceClient
          .from("user_roles")
          .select("role")
          .eq("user_id", targetAdminId)
          .eq("role", "admin");

        expect(preserved?.length).toBe(1);
      }
    });
  });
});
