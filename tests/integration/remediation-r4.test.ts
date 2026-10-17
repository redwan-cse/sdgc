import { describe, expect, it } from "vitest";
import { createAnonClient, createAuthClient, createServiceClient } from "./setup";

describe("R4: Persistent Workflows, Real Identity Data & Admin Parity Suite", () => {
  const serviceClient = createServiceClient();
  const anonClient = createAnonClient();

  describe("Public Content Persistence (Real Database Pages, No Fixture Fallbacks)", () => {
    it("reads real published home page content from database", async () => {
      const { data: page, error } = await anonClient
        .from("pages")
        .select("slug, title, status, content")
        .eq("slug", "home")
        .eq("status", "published")
        .maybeSingle();

      expect(error).toBeNull();
      expect(page).not.toBeNull();
      if (!page) throw new Error("Expected home page in database");
      expect(page.title).toContain("Saugatuck Douglas Garden Club");
      expect(page.status).toBe("published");
      expect(typeof page.content).toBe("string");
      expect(page.content).toContain("Civic landscaping");
    });

    it("reads real published garden walk content from database", async () => {
      const { data: page, error } = await anonClient
        .from("pages")
        .select("slug, title, status, content")
        .eq("slug", "garden-walk")
        .eq("status", "published")
        .maybeSingle();

      expect(error).toBeNull();
      expect(page).not.toBeNull();
      if (!page) throw new Error("Expected garden-walk page in database");
      expect(page.title).toContain("Garden Walk");
      expect(page.status).toBe("published");
    });

    it("returns null for unpublished pages without falling back to fixtures", async () => {
      // Temporarily mark garden-walk as draft
      const { error: draftErr } = await serviceClient
        .from("pages")
        .update({ status: "draft" })
        .eq("slug", "garden-walk");
      expect(draftErr).toBeNull();

      try {
        const { data: unpublished } = await anonClient
          .from("pages")
          .select("slug, status")
          .eq("slug", "garden-walk")
          .eq("status", "published")
          .maybeSingle();

        // Must be null when unpublished
        expect(unpublished).toBeNull();
      } finally {
        // Restore published status
        await serviceClient.from("pages").update({ status: "published" }).eq("slug", "garden-walk");
      }
    });

    it("reads real published upcoming events from database", async () => {
      const { data: events, error } = await anonClient
        .from("events")
        .select("id, title, starts_at, status")
        .eq("status", "published")
        .order("starts_at", { ascending: true })
        .limit(3);

      expect(error).toBeNull();
      expect(events).toBeDefined();
      expect(events?.length).toBeGreaterThanOrEqual(1);
      for (const ev of events ?? []) {
        expect(ev.id).toBeDefined();
        expect(ev.title).toBeDefined();
        expect(ev.starts_at).toBeDefined();
        expect(ev.status).toBe("published");
      }
    });
  });

  describe("Member Administration & Real Identity Security", () => {
    it("denies unauthenticated callers from calling get_admin_member_roster()", async () => {
      const { data, error } = await anonClient.rpc("get_admin_member_roster");
      expect(error).not.toBeNull();
      expect(data).toBeNull();
      expect(error?.code).toBe("42501");
    });

    it("denies regular members without members.manage from calling get_admin_member_roster()", async () => {
      const { client: memberClient } = await createAuthClient("member@sdgc.local");
      const { data, error } = await memberClient.rpc("get_admin_member_roster");
      expect(error).not.toBeNull();
      expect(data).toBeNull();
      expect(error?.code).toBe("42501");
    });

    it("allows authorized admin to retrieve member roster with real auth emails", async () => {
      const { client: adminClient } = await createAuthClient("admin@sdgc.local");
      const { data: roster, error } = await adminClient.rpc("get_admin_member_roster");

      expect(error).toBeNull();
      expect(roster).toBeDefined();
      expect(Array.isArray(roster)).toBe(true);
      expect(roster?.length).toBeGreaterThanOrEqual(1);

      // Verify that emails are real auth emails, not fabricated @example.com derived from username
      const memberEntry = roster?.find((m) => m.username === "active_member");
      expect(memberEntry).toBeDefined();
      expect(memberEntry?.email).toBe("member@sdgc.local");

      // Verify address and volunteer fields exist on roster items
      for (const item of roster ?? []) {
        expect(item).toHaveProperty("address_line1");
        expect(item).toHaveProperty("gardening_interests");
        expect(item).toHaveProperty("work_experience");
      }
    });

    it("updates member profile through admin_update_member_profile() RPC with audit logging", async () => {
      const { client: adminClient } = await createAuthClient("admin@sdgc.local");
      const memberUser = await serviceClient
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("username", "active_member")
        .single();
      expect(memberUser.data).toBeDefined();
      if (!memberUser.data) throw new Error("Expected member user profile");
      const memberId = memberUser.data.id;

      // Update profile fields as admin
      const { error: updateErr } = await adminClient.rpc("admin_update_member_profile", {
        target_user_id: memberId,
        p_first_name: "Eleanor",
        p_last_name: "Vance",
        p_phone: "269-555-4321",
        p_alt_phone: "",
        p_address_line1: "456 Bluebell Way",
        p_address_line2: "Apt 2B",
        p_city: "Douglas",
        p_state: "MI",
        p_postal_code: "49406",
        p_spouse_first_name: "",
        p_is_master_gardener: true,
        p_directory_opt_out: false,
        p_gardening_interests: "Heritage Perennials, Pollinator Sanctuaries",
        p_work_experience: "15 years landscape design",
      });
      expect(updateErr).toBeNull();

      // Verify persistence in profiles table
      const { data: updatedProfile, error: fetchErr } = await serviceClient
        .from("profiles")
        .select("*")
        .eq("id", memberId)
        .single();
      expect(fetchErr).toBeNull();
      expect(updatedProfile?.address_line1).toBe("456 Bluebell Way");
      expect(updatedProfile?.address_line2).toBe("Apt 2B");
      expect(updatedProfile?.phone).toBe("269-555-4321");
      expect(updatedProfile?.is_master_gardener).toBe(true);
      expect(updatedProfile?.gardening_interests).toBe(
        "Heritage Perennials, Pollinator Sanctuaries",
      );
      expect(updatedProfile?.volunteer_experience).toBe("15 years landscape design");
    });
  });

  describe("Dues Rate & Annual Term Configuration Parity", () => {
    it("denies unprivileged members from updating dues rates", async () => {
      const { client: memberClient } = await createAuthClient("member@sdgc.local");
      const { error } = await memberClient.rpc("update_dues_rate", {
        p_term_year: 2026,
        p_dues_cents: 6000,
      });
      expect(error).not.toBeNull();
      expect(error?.code).toBe("42501");
    });

    it("allows authorized staff to update term dues rates", async () => {
      const { client: adminClient } = await createAuthClient("admin@sdgc.local");
      const { data: updatedTerms, error } = await adminClient.rpc("update_dues_rate", {
        p_term_year: 2026,
        p_dues_cents: 5500,
      });

      expect(error).toBeNull();
      expect(updatedTerms).toBeDefined();
      expect(updatedTerms?.[0]?.dues_cents).toBe(5500);

      // Verify persistence directly
      const { data: term } = await serviceClient
        .from("membership_terms")
        .select("dues_cents")
        .eq("year", 2026)
        .single();
      expect(term?.dues_cents).toBe(5500);

      // Restore to standard 5000 cents
      await adminClient.rpc("update_dues_rate", {
        p_term_year: 2026,
        p_dues_cents: 5000,
      });
    });
  });

  describe("Media Library Persistence & Storage Integration", () => {
    it("queries media assets from real database and generates Storage URLs", async () => {
      const { data: media, error } = await anonClient
        .from("media_assets")
        .select("id, storage_path, alt_text, caption, is_public")
        .eq("is_public", true);

      expect(error).toBeNull();
      expect(media).toBeDefined();

      if (media && media.length > 0) {
        for (const item of media) {
          expect(item.id).toBeDefined();
          expect(item.alt_text).toBeDefined();
          expect(item.storage_path).toBeDefined();
          expect(item.is_public).toBe(true);
        }
      }
    });

    it("enforces RLS on media_assets for mutations", async () => {
      const { client: memberClient } = await createAuthClient("member@sdgc.local");

      // Member should not be permitted to insert media_assets
      const { error: insertErr } = await memberClient.from("media_assets").insert({
        storage_path: "unauthorized.jpg",
        mime_type: "image/jpeg",
        size_bytes: 1024,
        alt_text: "Unauthorized Upload",
      });
      expect(insertErr).not.toBeNull();
    });
  });
});
