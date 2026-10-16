import { expect, test } from "@playwright/test";

test.describe("Phase P8: RBAC Personas & Access Control Matrix E2E", () => {
  test("Super Admin persona has unrestricted access across all admin panels and directory", async ({
    page,
  }) => {
    // 1. Sign in as Super Admin
    await page.goto("/login");
    await page.getByLabel("Username or Email Address").fill("admin@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });

    // 2. Overview
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Administrative Dashboard");

    // 3. Members Panel
    await page.goto("/admin/members");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Member Management & Approvals",
    );

    // 4. Dues Panel
    await page.goto("/admin/dues");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Dues Reconciliation & Financials",
    );

    // 5. Events Panel
    await page.goto("/admin/events");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Events & Calendar Scheduling",
    );

    // 6. Content Panel
    await page.goto("/admin/content");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page Content & Site Copy");

    // 7. Messages Panel
    await page.goto("/admin/messages");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact Submissions Inbox");

    // 8. Media Panel
    await page.goto("/admin/media");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Media Library & Gallery Curation",
    );

    // 9. Member Directory
    await page.goto("/directory");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Private Member Directory");
  });

  test("Editor persona has content/events/media capabilities but blocked from financial/member administration", async ({
    page,
  }) => {
    // 1. Sign in as Editor
    await page.goto("/login");
    await page.getByLabel("Username or Email Address").fill("editor@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });

    // 2. Allowed panels
    await page.goto("/admin/events");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Events & Calendar Scheduling",
    );

    await page.goto("/admin/content");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page Content & Site Copy");

    await page.goto("/admin/media");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Media Library & Gallery Curation",
    );

    // 3. Denied panels: should redirect with unauthorized error
    await page.goto("/admin/dues");
    await expect(page).toHaveURL(/\/login\?error=unauthorized/);

    await page.goto("/admin/members");
    await expect(page).toHaveURL(/\/login\?error=unauthorized/);

    await page.goto("/admin/messages");
    await expect(page).toHaveURL(/\/login\?error=unauthorized/);
  });

  test("Treasurer persona has dues/financial reconciliation capabilities but blocked from editorial publishing and admin roster", async ({
    page,
  }) => {
    // 1. Sign in as Treasurer
    await page.goto("/login");
    await page.getByLabel("Username or Email Address").fill("treasurer@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });

    // 2. Allowed panels
    await page.goto("/admin/dues");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Dues Reconciliation & Financials",
    );

    // 3. Denied panels: members.manage is admin only; editorial is editor only
    await page.goto("/admin/members");
    await expect(page).toHaveURL(/\/login\?error=unauthorized/);

    await page.goto("/admin/content");
    await expect(page).toHaveURL(/\/login\?error=unauthorized/);

    await page.goto("/admin/events");
    await expect(page).toHaveURL(/\/login\?error=unauthorized/);

    await page.goto("/admin/media");
    await expect(page).toHaveURL(/\/login\?error=unauthorized/);
  });

  test("Combined Staff persona (editor + treasurer) can manage both editorial and financial domains", async ({
    page,
  }) => {
    // 1. Sign in as combined staff
    await page.goto("/login");
    await page.getByLabel("Username or Email Address").fill("editor_treasurer@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });

    // 2. Allowed editor panels
    await page.goto("/admin/events");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Events & Calendar Scheduling",
    );

    await page.goto("/admin/content");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page Content & Site Copy");

    await page.goto("/admin/media");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Media Library & Gallery Curation",
    );

    // 3. Allowed treasurer panels
    await page.goto("/admin/dues");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Dues Reconciliation & Financials",
    );

    // 4. Denied admin-only panels
    await page.goto("/admin/members");
    await expect(page).toHaveURL(/\/login\?error=unauthorized/);

    await page.goto("/admin/messages");
    await expect(page).toHaveURL(/\/login\?error=unauthorized/);
  });

  test("Active Member persona can browse directory and profile but has zero admin access", async ({
    page,
  }) => {
    // 1. Sign in as Active Member
    await page.goto("/login");
    await page.getByLabel("Username or Email Address").fill("member@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });

    // 2. Allowed member areas
    await page.goto("/directory");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Private Member Directory");

    // 3. Denied admin access
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/profile\?error=unauthorized/);

    await page.goto("/admin/dues");
    await expect(page).toHaveURL(/\/profile\?error=unauthorized/);
  });

  test("Pending Applicant persona cannot view private directory and cannot access admin", async ({
    page,
  }) => {
    // 1. Sign in as Pending Applicant
    await page.goto("/login");
    await page.getByLabel("Username or Email Address").fill("pending@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });

    // 2. Directory should show pending access locked notice
    await page.goto("/directory");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Member Directory Access Pending",
    );

    // 3. Denied admin access
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/profile\?error=unauthorized/);
  });

  test("Expired Member persona cannot view private directory and cannot access admin", async ({
    page,
  }) => {
    // 1. Sign in as Expired Member
    await page.goto("/login");
    await page.getByLabel("Username or Email Address").fill("expired@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });

    // 2. Directory should show locked notice
    await page.goto("/directory");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Member Directory Access Pending",
    );

    // 3. Denied admin access
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/profile\?error=unauthorized/);
  });

  test("Suspended Member persona cannot view private directory and cannot access admin", async ({
    page,
  }) => {
    // 1. Sign in as Suspended Member
    await page.goto("/login");
    await page.getByLabel("Username or Email Address").fill("suspended@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });

    // 2. Directory should show locked notice
    await page.goto("/directory");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Member Directory Access Pending",
    );

    // 3. Denied admin access
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/profile\?error=unauthorized/);
  });
});
