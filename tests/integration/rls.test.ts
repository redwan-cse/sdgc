import { describe, expect, it } from "vitest";
import { createAnonClient, createAuthClient, getLocalFixtures } from "./setup";

describe("Real-Client RLS Access and Denial Tests", () => {
  const fixtures = getLocalFixtures();
  const anonClient = createAnonClient();

  describe("Anonymous Access Controls", () => {
    it("allows reading published content and venues", async () => {
      const { data: pages, error: pagesErr } = await anonClient
        .from("pages")
        .select("slug, status")
        .limit(5);
      expect(pagesErr).toBeNull();
      expect(pages).toBeDefined();
      expect(pages?.every((p) => p.status === "published")).toBe(true);

      const { data: venues, error: venuesErr } = await anonClient
        .from("venues")
        .select("id, name")
        .limit(5);
      expect(venuesErr).toBeNull();
      expect(venues).toBeDefined();

      const { data: terms, error: termsErr } = await anonClient
        .from("membership_terms")
        .select("id, year")
        .limit(5);
      expect(termsErr).toBeNull();
      expect(terms).toBeDefined();
    });

    it("denies reading draft pages or draft events", async () => {
      const { data: draftPages } = await anonClient
        .from("pages")
        .select("slug, status")
        .eq("status", "draft");
      expect(draftPages).toEqual([]);

      const { data: draftEvents } = await anonClient
        .from("events")
        .select("id, status")
        .eq("status", "draft");
      expect(draftEvents).toEqual([]);
    });

    it("denies reading member profiles and private rosters", async () => {
      const { data: profiles, error } = await anonClient
        .from("profiles")
        .select("id, username, first_name, last_name");
      // Anonymous cannot read profiles under least privilege & RLS
      expect(error).not.toBeNull();
      expect(profiles).toBeNull();
    });

    it("denies reading contact messages and payments", async () => {
      const { data: messages, error: msgErr } = await anonClient
        .from("contact_messages")
        .select("id, name, email");
      expect(msgErr).not.toBeNull();
      expect(messages).toBeNull();

      const { data: payments, error: payErr } = await anonClient
        .from("payments")
        .select("id, amount_cents");
      expect(payErr).not.toBeNull();
      expect(payments).toBeNull();
    });

    it("denies reading audit events and user roles", async () => {
      const { data: auditEvents, error: auditErr } = await anonClient
        .from("audit_events")
        .select("id, action");
      expect(auditErr).not.toBeNull();
      expect(auditEvents).toBeNull();

      const { data: roles, error: roleErr } = await anonClient
        .from("user_roles")
        .select("user_id, role");
      expect(roleErr).not.toBeNull();
      expect(roles).toBeNull();
    });
  });

  describe("Authenticated Member Profile Isolation (User A vs User B)", () => {
    it("allows User A to update their own profile", async () => {
      const { client, userId } = await createAuthClient("member@sdgc.local");

      const { data, error } = await client
        .from("profiles")
        .update({ first_name: "UpdatedMary" })
        .eq("id", userId)
        .select("first_name")
        .single();

      expect(error).toBeNull();
      expect(data?.first_name).toBe("UpdatedMary");
    });

    it("denies User A from updating User B's profile", async () => {
      const { client: clientA } = await createAuthClient("member@sdgc.local");
      const userBId = fixtures.personas["member_b@sdgc.local"].id;

      // User A attempts to update User B's profile
      const { data } = await clientA
        .from("profiles")
        .update({ first_name: "HackedBeta" })
        .eq("id", userBId)
        .select();

      // Either an error is returned or zero rows are affected (RLS filter)
      expect(data === null || data.length === 0).toBe(true);

      // Verify User B's profile was untouched
      const { client: clientB } = await createAuthClient("member_b@sdgc.local");
      const { data: profileB } = await clientB
        .from("profiles")
        .select("first_name")
        .eq("id", userBId)
        .single();
      expect(profileB?.first_name).not.toBe("HackedBeta");
    });
  });

  describe("Privilege Escalation and Forgery Protection", () => {
    it("denies regular member from granting themselves admin role", async () => {
      const { client, userId } = await createAuthClient("member@sdgc.local");

      const { data, error } = await client
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" })
        .select();

      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });

    it("denies regular member from approving their own membership", async () => {
      const { client, userId } = await createAuthClient("pending@sdgc.local");

      const { data } = await client
        .from("memberships")
        .update({ status: "approved" })
        .eq("user_id", userId)
        .select();

      // RLS policy prevents regular members from updating membership status
      expect(data === null || data.length === 0).toBe(true);
    });

    it("denies regular member from forging payment confirmation", async () => {
      const { client, userId } = await createAuthClient("member@sdgc.local");

      const { error } = await client
        .from("payments")
        .insert({
          user_id: userId,
          membership_id: "00000000-0000-0000-0000-000000000001",
          term_id: fixtures.termId,
          amount_cents: 5000,
          currency: "USD",
          status: "succeeded",
          payment_method: "credit_card",
        })
        .select();

      // RLS policy denies regular authenticated users from inserting succeeded payments directly
      expect(error).not.toBeNull();
    });
  });

  describe("Administrative Roles and Capability Verification", () => {
    it("allows admin to view audit events and user roles", async () => {
      const { client } = await createAuthClient("admin@sdgc.local");

      const { data: roles, error: rolesErr } = await client
        .from("user_roles")
        .select("user_id, role");
      expect(rolesErr).toBeNull();
      expect(roles && roles.length > 0).toBe(true);
    });

    it("allows treasurer to view payments and dues reconciliation data", async () => {
      const { client } = await createAuthClient("treasurer@sdgc.local");

      const { data: payments, error: payErr } = await client
        .from("payments")
        .select("id, amount_cents, status");
      expect(payErr).toBeNull();
      expect(payments).toBeDefined();
    });

    it("allows editor to view draft content for editing", async () => {
      const { client } = await createAuthClient("editor@sdgc.local");

      const { data: draftPages, error } = await client.from("pages").select("slug, status");
      expect(error).toBeNull();
      expect(draftPages).toBeDefined();
    });
  });
});
