import { expect, test } from "@playwright/test";

test.describe("Auth & Panels Surfaces Preview", () => {
  test("login form renders username-or-email field and validation feedback", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign In to Your Account");

    // Click submit empty
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Please enter your username or email address")).toBeVisible();

    // Fill invalid input
    await page.getByLabel("Username or Email Address").fill("invalid_user");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("become a member form renders all civic project interest checkboxes and dues card", async ({
    page,
  }) => {
    await page.goto("/join");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Become A Member");

    // Check dues amount
    await expect(page.getByText("$50").first()).toBeVisible();
    await expect(page.getByText("Calendar Year 2026")).toBeVisible();

    // Check project checkboxes
    await expect(page.getByLabel("Community Beautification")).toBeVisible();
    await expect(page.getByLabel("Garden Walk Fund Raiser")).toBeVisible();
    await expect(page.getByLabel("Community Garden Recognition Awards")).toBeVisible();
    await expect(page.getByLabel("6th Grade Workshop")).toBeVisible();
  });

  test("password recovery flows render cleanly", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Reset Your Password");

    await page.getByLabel("Account Email Address").fill("member@example.org");
    await page.getByRole("button", { name: "Send Password Reset Link" }).click();
    await expect(
      page.getByText(
        "If an account exists with that email address, a password reset link has been dispatched",
      ),
    ).toBeVisible();

    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create New Password");
  });

  test("admin dashboard and navigation tabs render cleanly", async ({ page }) => {
    await page.goto("/login?returnTo=/admin");
    await page.getByLabel("Username or Email Address").fill("admin@sdgc.local");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();
    await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });
    await expect(page.getByText(/Active Members \((2026|Current Term)\)/)).toBeVisible();

    // Navigate to Members & Approvals
    await page.getByRole("link", { name: "Members & Approvals" }).click();
    await expect(page).toHaveURL("/admin/members");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Member Management & Approvals",
    );

    // Navigate to Dues & Reconciliation
    await page.getByRole("link", { name: "Dues & Reconciliation" }).click();
    await expect(page).toHaveURL("/admin/dues");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Dues Reconciliation & Financials",
    );

    // Navigate to Events & Scheduling
    await page.getByRole("link", { name: "Events & Scheduling" }).click();
    await expect(page).toHaveURL("/admin/events");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Events & Calendar Scheduling",
    );

    // Navigate to Media & Albums
    await page.getByRole("link", { name: "Media & Albums" }).click();
    await expect(page).toHaveURL("/admin/media");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Media Library & Gallery Curation",
    );

    // Navigate to Pages & Copy
    await page.getByRole("link", { name: "Pages & Copy" }).click();
    await expect(page).toHaveURL("/admin/content");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page Content & Site Copy");

    // Navigate to Contact Inbox
    await page.getByRole("link", { name: "Contact Inbox" }).click();
    await expect(page).toHaveURL("/admin/messages");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact Submissions Inbox");
  });
});
