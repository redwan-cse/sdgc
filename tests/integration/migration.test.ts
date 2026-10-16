import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error import-wordpress.mjs is an ES module script without generated types
import { isLocalTarget, runImport, sanitizeHtml } from "../../scripts/import-wordpress.mjs";
import { createServiceClient, serviceRoleKey, supabaseUrl } from "./setup";

describe("MIG-01: WordPress Migration Tool & Security Guardrails", () => {
  const serviceClient = createServiceClient();
  const inputDir = path.resolve("tests/fixtures/synthetic-export");

  it("strictly rejects remote and hosted Supabase targets", async () => {
    expect(isLocalTarget("https://remote-project.supabase.co")).toBe(false);
    expect(isLocalTarget("https://192.168.1.50:54321")).toBe(false);
    expect(isLocalTarget("http://127.0.0.1:54321")).toBe(true);
    expect(isLocalTarget("http://localhost:54321")).toBe(true);

    await expect(
      runImport({
        dryRun: true,
        inputDir,
        supabaseUrl: "https://my-prod.supabase.co",
      }),
    ).rejects.toThrow(/CRITICAL SECURITY VIOLATION/);
  });

  it("thoroughly sanitizes malicious and suspicious HTML markup", () => {
    const malicious =
      '<p>Welcome <script>alert("xss")</script><iframe src="https://evil.com"></iframe><img src="x" onerror="stealCookies()" />Clean content continues safely.</p>';
    const sanitized = sanitizeHtml(malicious);

    expect(sanitized).not.toContain("<script");
    expect(sanitized).not.toContain("alert(");
    expect(sanitized).not.toContain("<iframe");
    expect(sanitized).not.toContain("onerror");
    expect(sanitized).toContain("Clean content continues safely.");
  });

  it("safely handles missing media assets and flags warnings without crashing", async () => {
    const report = await runImport({
      dryRun: true,
      inputDir,
    });

    expect(report.dryRun).toBe(true);
    expect(report.counts.media.total).toBe(3);
    const missingWarning = report.warnings.find((w: string) =>
      w.includes("non-existent-archive.jpg"),
    );
    expect(missingWarning).toBeDefined();
    expect(missingWarning).toContain("source file missing");
  });

  it("rejects WordPress phpass password hashes and flags accounts for invitation/reset", async () => {
    const report = await runImport({
      dryRun: true,
      inputDir,
    });

    const passwordWarnings = report.warnings.filter((w: string) =>
      w.includes("WordPress phpass hash; hash rejected"),
    );
    expect(passwordWarnings.length).toBeGreaterThanOrEqual(2);
    expect(report.errors).toHaveLength(0);
  });

  it("replays import idempotently with zero duplicate rows in Supabase", async () => {
    // 1. First Execution (Apply)
    const run1 = await runImport({
      dryRun: false,
      inputDir,
      supabaseUrl,
      supabaseServiceKey: serviceRoleKey,
    });

    expect(run1.errors).toHaveLength(0);
    expect(run1.counts.pages.total).toBe(3);
    expect(run1.counts.events.total).toBe(2);

    // Snapshot counts from database
    const { count: pagesCount1 } = await serviceClient
      .from("pages")
      .select("*", { count: "exact", head: true });
    const { count: eventsCount1 } = await serviceClient
      .from("events")
      .select("*", { count: "exact", head: true });
    const { count: mappingsCount1 } = await serviceClient
      .from("legacy_mappings")
      .select("*", { count: "exact", head: true });

    // 2. Second Execution (Replay with identical input)
    const run2 = await runImport({
      dryRun: false,
      inputDir,
      supabaseUrl,
      supabaseServiceKey: serviceRoleKey,
    });

    expect(run2.errors).toHaveLength(0);

    // Verify row counts did not inflate with duplicates
    const { count: pagesCount2 } = await serviceClient
      .from("pages")
      .select("*", { count: "exact", head: true });
    const { count: eventsCount2 } = await serviceClient
      .from("events")
      .select("*", { count: "exact", head: true });
    const { count: mappingsCount2 } = await serviceClient
      .from("legacy_mappings")
      .select("*", { count: "exact", head: true });

    expect(pagesCount2).toBe(pagesCount1);
    expect(eventsCount2).toBe(eventsCount1);
    expect(mappingsCount2).toBe(mappingsCount1);

    // Verify sanitized page stored in database
    const { data: sanitizedPage } = await serviceClient
      .from("pages")
      .select("content")
      .eq("slug", "suspicious-announcement")
      .single();

    expect(sanitizedPage?.content).not.toContain("<script");
    expect(sanitizedPage?.content).not.toContain("onerror");
    expect(sanitizedPage?.content).toContain(
      "Sanitized community announcement content continues safely.",
    );

    // Verify optional fields omission on synth_bob_planter
    const { data: bobProfile } = await serviceClient
      .from("profiles")
      .select("phone, address_line1, spouse_name")
      .eq("username", "synth_bob_planter")
      .single();

    expect(bobProfile?.phone).toBeNull();
    expect(bobProfile?.address_line1).toBeNull();
    expect(bobProfile?.spouse_name).toBeNull();
  });
});
