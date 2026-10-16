import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

test.describe("Phase P7 — Migration Tooling, SEO Metadata & Cutover Evidence", () => {
  const artifactsDir = path.join(process.cwd(), "artifacts", "phase-07");

  test.beforeAll(() => {
    fs.mkdirSync(artifactsDir, { recursive: true });
  });

  test("sitemap.xml returns valid public routes and strictly excludes private areas", async ({
    request,
  }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const text = await res.text();

    expect(text).toContain("<urlset");
    expect(text).toContain("/about");
    expect(text).toContain("/garden-walk");
    expect(text).toContain("/events");
    expect(text).toContain("/gallery");
    expect(text).toContain("/membership");
    expect(text).toContain("/contact");
    expect(text).toContain("/join");

    // Strictly excludes private / admin / member routes
    expect(text).not.toContain("/admin");
    expect(text).not.toContain("/profile");
    expect(text).not.toContain("/directory");
    expect(text).not.toContain("/auth/");
    expect(text).not.toContain("/reset-password");
    expect(text).not.toContain("/forgot-password");
  });

  test("robots.txt delivers crawler directives, disallows private paths, and links sitemap", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const text = await res.text();

    expect(text).toContain("User-Agent: *");
    expect(text).toContain("Disallow: /admin/");
    expect(text).toContain("Disallow: /profile/");
    expect(text).toContain("Disallow: /directory/");
    expect(text).toContain("Disallow: /auth/");
    expect(text).toContain("Sitemap:");
    expect(text).toContain("/sitemap.xml");
  });

  test("legacy discovery routes issue permanent redirects and preserve query parameters", async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    // 1. /becomeamember with query params redirects to /join preserving query params
    await page.goto("/becomeamember?campaign=spring2026&ref=posters");
    await expect(page).toHaveURL(/\/join\?campaign=spring2026&ref=posters$/);
    await page.screenshot({
      path: path.join(artifactsDir, `03-redirected-join${suffix}.png`),
      fullPage: true,
    });

    // 2. /aboutourclub with query params redirects to /about preserving query params
    await page.goto("/aboutourclub?source=legacy_search");
    await expect(page).toHaveURL(/\/about\?source=legacy_search$/);

    // 3. /aboutourclub/ with trailing slash redirects to /about
    await page.goto("/aboutourclub/");
    await expect(page).toHaveURL(/\/about$/);

    // 4. /wp-login.php redirects to /login
    await page.goto("/wp-login.php");
    await expect(page).toHaveURL(/\/login$/);

    // 5. /wp-admin redirects to /admin (and auth protection securely redirects unauthenticated users to login)
    await page.goto("/wp-admin");
    await expect(page).toHaveURL(/\/(admin$|login\?returnTo=%2Fadmin)/);

    // 6. /feed redirects to /events
    await page.goto("/feed");
    await expect(page).toHaveURL(/\/events$/);
  });

  test("unknown legacy or invalid routes return valid 404 with user navigation", async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    const response = await page.goto("/non-existent-legacy-path-test-404");
    expect(response?.status()).toBe(404);

    await expect(
      page.getByRole("heading", { name: /Page Not Found|404/i }).or(page.getByText(/404/i)),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `02-not-found${suffix}.png`),
      fullPage: true,
    });
  });

  test("event detail page provides valid schema.org/Event JSON-LD structured data and Open Graph meta", async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/event/2026-garden-walk-fundraiser");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Verify Open Graph & Twitter metadata in document head
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).toBeTruthy();

    const ogSiteName = await page.locator('meta[property="og:site_name"]').getAttribute("content");
    expect(ogSiteName).toBe("Saugatuck Douglas Garden Club");

    // Extract and validate schema.org/Event JSON-LD
    const ldScript = page.locator('script[type="application/ld+json"]');
    await expect(ldScript).toHaveCount(1);

    const ldJsonText = await ldScript.textContent();
    expect(ldJsonText).toBeTruthy();

    const ld = JSON.parse(ldJsonText as string);
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Event");
    expect(ld.name).toContain("Garden Walk");
    expect(ld.startDate).toBeTruthy();
    expect(ld.endDate).toBeTruthy();
    expect(ld.eventStatus).toBe("https://schema.org/EventScheduled");
    expect(ld.eventAttendanceMode).toBe("https://schema.org/OfflineEventAttendanceMode");
    expect(ld.location["@type"]).toBe("Place");
    expect(ld.location.name).toBeTruthy();
    expect(ld.location.address["@type"]).toBe("PostalAddress");
    expect(ld.location.address.addressRegion).toBe("MI");

    await page.screenshot({
      path: path.join(artifactsDir, `01-seo-event-ld${suffix}.png`),
      fullPage: true,
    });
  });
});
