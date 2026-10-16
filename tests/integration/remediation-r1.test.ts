import { describe, expect, it } from "vitest";
import { createAnonClient, createAuthClient, createServiceClient, getLocalFixtures } from "./setup";

describe("Work Package R1: Security and Privacy Boundary Regressions", () => {
  const fixtures = getLocalFixtures();
  const anonClient = createAnonClient();
  const serviceClient = createServiceClient();

  const userAEmail = "member@sdgc.local";
  const userBEmail = "member_b@sdgc.local";
  const pendingEmail = "pending@sdgc.local";
  const expiredEmail = "expired@sdgc.local";
  const suspendedEmail = "suspended@sdgc.local";

  const userBId = fixtures.personas[userBEmail].id;
  const pendingId = fixtures.personas[pendingEmail].id;
  const expiredId = fixtures.personas[expiredEmail].id;
  const suspendedId = fixtures.personas[suspendedEmail].id;

  describe("R1.2: Directory Privacy and Profile Column Isolation", () => {
    it("denies User A from reading User B's private profile columns via profiles table", async () => {
      const { client: clientA } = await createAuthClient(userAEmail);

      // User A attempts to select User B's full profile row including private fields
      const { data } = await clientA
        .from("profiles")
        .select("id, address_line1, address_line2, birth_month, birth_day, spouse_name")
        .eq("id", userBId)
        .maybeSingle();

      // Under hardened RLS, selecting other users' rows from profiles table must return null/empty (or error)
      expect(data).toBeNull();
    });

    it("restricts member_directory view to authorized fields and excludes private columns", async () => {
      const { client: clientA } = await createAuthClient(userAEmail);

      // Active member queries member_directory view
      const { data, error } = await clientA.from("member_directory").select("*");

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);

      if (data && data.length > 0) {
        const firstEntry = data[0] as Record<string, unknown>;
        // Must NOT expose private PII columns
        expect(firstEntry.address_line1).toBeUndefined();
        expect(firstEntry.address_line2).toBeUndefined();
        expect(firstEntry.birth_month).toBeUndefined();
        expect(firstEntry.birth_day).toBeUndefined();
        expect(firstEntry.spouse_name).toBeUndefined();

        // Must include permitted community directory columns
        expect(firstEntry.username).toBeDefined();
        expect(firstEntry.first_name).toBeDefined();
        expect(firstEntry.last_name).toBeDefined();
      }
    });

    it("excludes pending, expired, suspended, and opted-out members from member_directory", async () => {
      const { client: clientA } = await createAuthClient(userAEmail);

      // Set userB as opted out temporarily
      await serviceClient.from("profiles").update({ directory_opt_out: true }).eq("id", userBId);

      try {
        const { data, error } = await clientA.from("member_directory").select("id");

        expect(error).toBeNull();
        const listedIds = (data || []).map((m) => m.id);

        // Opted out user B must NOT be listed
        expect(listedIds).not.toContain(userBId);

        // Ineligible members must NOT be listed
        expect(listedIds).not.toContain(pendingId);
        expect(listedIds).not.toContain(expiredId);
        expect(listedIds).not.toContain(suspendedId);
      } finally {
        // Restore user B opt-out to false
        await serviceClient.from("profiles").update({ directory_opt_out: false }).eq("id", userBId);
      }
    });

    it("denies unapproved members and anonymous callers from reading member_directory", async () => {
      // Anonymous caller
      const { data: anonData, error: anonErr } = await anonClient
        .from("member_directory")
        .select("id");
      expect(anonErr || anonData === null || anonData.length === 0).toBeTruthy();

      // Pending applicant caller
      const { client: pendingClient } = await createAuthClient(pendingEmail);
      const { data: pendingData, error: pendingErr } = await pendingClient
        .from("member_directory")
        .select("id");
      expect(pendingErr || pendingData === null || pendingData.length === 0).toBeTruthy();
    });
  });

  describe("R1.3: Contact Write Boundary Enforcement", () => {
    it("denies direct anonymous REST insert into contact_messages", async () => {
      const probeName = `probe_anon_${Date.now()}`;
      const { error } = await anonClient.from("contact_messages").insert({
        name: probeName,
        email: "attacker@example.com",
        message: "Attempting direct REST insert bypassing server action",
        status: "archived", // Attacker trying to set server-owned field
      });

      // Verify row was NOT inserted into DB
      const { data: check } = await serviceClient
        .from("contact_messages")
        .select("id")
        .eq("name", probeName);
      expect(check?.length || 0).toBe(0);

      expect(error).not.toBeNull();
      expect(
        ["42501", "PGRST301"].includes(error?.code || "") ||
          error?.message.toLowerCase().includes("permission denied"),
      ).toBe(true);
    });

    it("denies direct authenticated non-admin REST insert into contact_messages", async () => {
      const { client: clientA } = await createAuthClient(userAEmail);
      const probeName = `probe_member_${Date.now()}`;

      const { error } = await clientA.from("contact_messages").insert({
        name: probeName,
        email: "member@example.com",
        message: "Bypassing action",
        status: "unread",
      });

      // Verify row was NOT inserted into DB
      const { data: check } = await serviceClient
        .from("contact_messages")
        .select("id")
        .eq("name", probeName);
      expect(check?.length || 0).toBe(0);

      expect(error).not.toBeNull();
      expect(
        ["42501", "PGRST301"].includes(error?.code || "") ||
          error?.message.toLowerCase().includes("permission denied"),
      ).toBe(true);
    });
  });

  describe("R1.4: Trusted Audit Trail Enforcement", () => {
    it("denies direct authenticated REST insert into audit_events", async () => {
      const { client: clientA, userId } = await createAuthClient(userAEmail);
      const probeAction = `probe_forged_${Date.now()}`;

      const { error } = await clientA.from("audit_events").insert({
        actor_id: userId,
        action: probeAction,
        entity_type: "membership",
        entity_id: crypto.randomUUID(),
        details: { fabricated: true },
      });

      // Verify row was NOT inserted into DB
      const { data: check } = await serviceClient
        .from("audit_events")
        .select("id")
        .eq("action", probeAction);
      expect(check?.length || 0).toBe(0);

      expect(error).not.toBeNull();
      expect(
        ["42501", "PGRST301"].includes(error?.code || "") ||
          error?.message.toLowerCase().includes("permission denied"),
      ).toBe(true);
    });

    it("denies pending applicant direct insert into audit_events", async () => {
      const { client: pendingClient, userId } = await createAuthClient(pendingEmail);
      const probeAction = `probe_pending_${Date.now()}`;

      const { error } = await pendingClient.from("audit_events").insert({
        actor_id: userId,
        action: probeAction,
        entity_type: "security",
        entity_id: crypto.randomUUID(),
        details: { attempt: "forge" },
      });

      // Verify row was NOT inserted into DB
      const { data: check } = await serviceClient
        .from("audit_events")
        .select("id")
        .eq("action", probeAction);
      expect(check?.length || 0).toBe(0);

      expect(error).not.toBeNull();
      expect(
        ["42501", "PGRST301"].includes(error?.code || "") ||
          error?.message.toLowerCase().includes("permission denied"),
      ).toBe(true);
    });
  });
});
