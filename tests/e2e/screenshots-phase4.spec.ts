import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

test.describe("Capture Phase 4 Authentication & Member Profile Screenshots", () => {
  const artifactsDir = path.join(process.cwd(), "artifacts", "phase-04");

  test.beforeAll(() => {
    fs.mkdirSync(artifactsDir, { recursive: true });
  });

  test("capture login screen and error states", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    // 1. Login initial screen
    await page.goto("/login");
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(artifactsDir, `01-login-screen${suffix}.png`),
      fullPage: true,
    });

    // 2. Login error state
    await page.getByLabel("Username or Email Address").fill("active_member");
    await page.getByLabel("Password").fill("WrongPassword!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();
    await expect(page.getByText("Invalid username, email, or password.")).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `02-login-error-state${suffix}.png`),
      fullPage: true,
    });
  });

  test("capture registration form with 8 civic project options and dues policy", async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/join");
    await page.waitForTimeout(300);

    // Select project checkboxes
    await page.getByLabel("Community Beautification").check();
    await page.getByLabel("Garden Walk Fund Raiser").check();

    await page.screenshot({
      path: path.join(artifactsDir, `03-registration-form${suffix}.png`),
      fullPage: true,
    });
  });

  test("capture password recovery flow", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    await page.goto("/forgot-password");
    await page.getByLabel("Account Email Address").fill("member@sdgc.local");
    await page.getByRole("button", { name: "Send Password Reset Link" }).click();

    await expect(page.getByText("If an account exists with that email address")).toBeVisible();

    await page.screenshot({
      path: path.join(artifactsDir, `04-password-recovery${suffix}.png`),
      fullPage: true,
    });
  });

  test("capture authenticated member profile and edit experience", async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";
    const suffix = isMobile ? "-mobile" : "";

    // Login as active member
    await page.goto("/login?returnTo=/profile");
    await page.getByLabel("Username or Email Address").fill("active_member");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign In to Member Area" }).click();

    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("My Member Profile");

    // Initial loaded profile
    await page.screenshot({
      path: path.join(artifactsDir, `05-member-profile-active${suffix}.png`),
      fullPage: true,
    });

    // Update profile
    await page.getByLabel("Home Phone").fill("269-555-0777");
    await page.getByRole("button", { name: "Save Profile Updates" }).click();
    await expect(page.getByText("Profile updated successfully!")).toBeVisible();

    // Updated state screenshot
    await page.screenshot({
      path: path.join(artifactsDir, `06-member-profile-saved${suffix}.png`),
      fullPage: true,
    });
  });
});
