import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

test.describe("Phase P6 — Member Directory, Editorial Publishing & Administration", () => {
  const artifactsDir = path.join(process.cwd(), "artifacts", "phase-06");

  test.beforeAll(() => {
    fs.mkdirSync(artifactsDir, { recursive: true });
  });

  test("unauthenticated visitor navigating to /directory redirects to login", async ({ page }) => {
    await page.goto("/directory");
    await expect(page).toHaveURL(/\/login\?returnTo=(\/|%2F)directory/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Sign In to Your Account|Member Sign In/,
    );
  });

  test("pending applicant sees friendly pending status banner on directory", async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/login?returnTo=/directory");
    await page.getByLabel("Username or Email Address").fill("pending@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page).toHaveURL(/\/directory/, { timeout: 15000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Member Directory Access Pending",
    );
    await expect(
      page.getByText(/private community benefit reserved for active members/i),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `02-member-directory-pending${suffix}.png`),
      fullPage: true,
    });
  });

  test("active member searches and filters directory cards", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/login?returnTo=/directory");
    await page.getByLabel("Username or Email Address").fill("member@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page).toHaveURL(/\/directory/, { timeout: 15000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Private Member Directory|SDGC Member Directory/,
    );
    await expect(page.getByText(/Active Members/i)).toBeVisible();

    // Verify member cards render
    await expect(page.getByRole("heading", { name: "Betty Beta" })).toBeVisible();

    // Test search filter
    const searchInput = page.getByPlaceholder(/Search by member name/i);
    await searchInput.fill("Betty");
    await expect(page.getByText("Betty Beta")).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `01-member-directory-active${suffix}.png`),
      fullPage: true,
    });
  });

  test("admin overview dashboard renders live metrics and navigation", async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/login?returnTo=/admin");
    await page.getByLabel("Username or Email Address").fill("admin@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Administrative Dashboard");
    await expect(page.getByText(/Active Members \((2026|Current Term)\)/)).toBeVisible();
    await expect(page.getByText("Pending Approvals")).toBeVisible();
    await expect(page.getByText("Unreconciled Dues")).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `03-admin-overview${suffix}.png`),
      fullPage: true,
    });
  });

  test("admin member approvals and role assignment modal", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/login?returnTo=/admin/members");
    await page.getByLabel("Username or Email Address").fill("admin@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page).toHaveURL(/\/admin\/members/, { timeout: 15000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Member (Management|Roster) & Approvals/,
    );
    await expect(page.getByText("Paul Pending").first()).toBeVisible();

    // Verify search input
    const search = page.getByPlaceholder("Search members...");
    await search.fill("Paul");
    await expect(page.getByText("Paul Pending").first()).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `04-admin-members${suffix}.png`),
      fullPage: true,
    });
  });

  test("treasurer dues management and check reconciliation journal", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/login?returnTo=/admin/dues");
    await page.getByLabel("Username or Email Address").fill("treasurer@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page).toHaveURL(/\/admin\/dues/, { timeout: 15000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Dues (Reconciliation & Financials|& Financial Reconciliation)/,
    );
    await expect(page.getByText("Calendar Year 2026 • $50.00 USD")).toBeVisible();
    await expect(page.getByText(/Dues Payment Journal/i)).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `05-admin-dues${suffix}.png`),
      fullPage: true,
    });
  });

  test("editor events scheduling and add event modal", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/login?returnTo=/admin/events");
    await page.getByLabel("Username or Email Address").fill("editor@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page).toHaveURL(/\/admin\/events/, { timeout: 15000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Events & Calendar Scheduling",
    );

    // Open Add Event modal
    const addBtn = page.getByRole("button", { name: "+ Add New Event" });
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await expect(
      page.getByRole("heading", { name: /Create New Club Event|Schedule New Event/ }),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `06-admin-events${suffix}.png`),
      fullPage: true,
    });

    // Close modal
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("editor content page copy editor modal", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/login?returnTo=/admin/content");
    await page.getByLabel("Username or Email Address").fill("editor@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page).toHaveURL(/\/admin\/content/, { timeout: 15000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page Content & Site Copy");
    await expect(page.getByText("About Saugatuck Douglas Garden Club").first()).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `07-admin-content${suffix}.png`),
      fullPage: true,
    });
  });

  test("admin contact message inbox triage", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/login?returnTo=/admin/messages");
    await page.getByLabel("Username or Email Address").fill("admin@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page).toHaveURL(/\/admin\/messages/, { timeout: 15000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /Contact (Submissions|Messages) Inbox/,
    );

    await page.screenshot({
      path: path.join(artifactsDir, `08-admin-messages${suffix}.png`),
      fullPage: true,
    });
  });

  test("editor media library and album organization", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/login?returnTo=/admin/media");
    await page.getByLabel("Username or Email Address").fill("editor@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page).toHaveURL(/\/admin\/media/, { timeout: 15000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Media Library/);

    await page.screenshot({
      path: path.join(artifactsDir, `09-admin-media${suffix}.png`),
      fullPage: true,
    });
  });

  test("enforces role separation by redirecting unauthorized roles", async ({ page }) => {
    // 1. Regular member attempts to visit /admin -> redirected to /profile?error=unauthorized
    await page.goto("/login?returnTo=/admin");
    await page.getByLabel("Username or Email Address").fill("member@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page).toHaveURL(/\/profile\?error=unauthorized/, { timeout: 15000 });

    // 2. Editor attempts to visit /admin/dues -> redirected away
    await page.goto("/login?returnTo=/admin/dues");
    await page.getByLabel("Username or Email Address").fill("editor@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page).toHaveURL(/\/login\?error=unauthorized/, { timeout: 15000 });
  });
});
