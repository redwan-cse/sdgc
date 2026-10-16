import { expect, test } from "@playwright/test";

test.describe("Browser Hydration and Script Tag Verification", () => {
  test("homepage loads without script tag warnings or hydration errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify no script tag warnings
    const scriptTagErrors = consoleErrors.filter((e) =>
      e.includes("Encountered a script tag while rendering React component"),
    );
    expect(scriptTagErrors).toHaveLength(0);

    // Verify no React hydration mismatch errors
    const hydrationErrors = [...consoleErrors, ...pageErrors].filter(
      (e) => e.includes("Hydration failed") || e.includes("hydration-mismatch"),
    );
    expect(hydrationErrors).toHaveLength(0);

    // Verify contact form is rendered and interactive
    const contactSection = page.locator("#contact");
    await expect(contactSection).toBeVisible();

    const nameInput = page.locator("#contact-name");
    await expect(nameInput).toBeVisible();
    await nameInput.fill("Jane Tester");

    const emailInput = page.locator("#contact-email");
    await expect(emailInput).toBeVisible();
    await emailInput.fill("jane.tester@example.com");

    const messageInput = page.locator("#contact-message");
    await expect(messageInput).toBeVisible();
    await messageInput.fill("Checking browser hydration and form input fields.");

    expect(await nameInput.inputValue()).toBe("Jane Tester");
    expect(await emailInput.inputValue()).toBe("jane.tester@example.com");
  });

  test("standalone contact page loads cleanly without console or hydration errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await page.goto("/contact");
    await page.waitForLoadState("networkidle");

    const scriptTagErrors = consoleErrors.filter((e) =>
      e.includes("Encountered a script tag while rendering React component"),
    );
    expect(scriptTagErrors).toHaveLength(0);

    const hydrationErrors = [...consoleErrors, ...pageErrors].filter(
      (e) => e.includes("Hydration failed") || e.includes("hydration-mismatch"),
    );
    expect(hydrationErrors).toHaveLength(0);

    const emailInput = page.locator("#contact-email");
    await expect(emailInput).toBeVisible();
  });
});
