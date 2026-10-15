import { expect, test } from "@playwright/test";

test.describe("Public Site Navigation & Experiences", () => {
  test("navigates top-level pages correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Saugatuck Douglas Garden Club",
    );

    const isMobile = (page.viewportSize()?.width ?? 1000) < 768;

    const navigateTo = async (label: string) => {
      if (isMobile) {
        await page.waitForSelector("header button[data-hydrated='true']");
        const toggle = page.getByLabel("Open main navigation menu");
        if (await toggle.isVisible()) {
          await toggle.click();
        }
        await page.locator("#mobile-navigation").getByRole("link", { name: label }).click();
      } else {
        await page.getByRole("banner").getByRole("link", { name: label }).click();
      }
    };

    // About Our Club
    await navigateTo("About Our Club");
    await expect(page).toHaveURL("/aboutourclub");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("About Our Club");

    // Annual Garden Walk
    await navigateTo("Garden Walk");
    await expect(page).toHaveURL("/garden-walk");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Annual Garden Walk");

    // Gallery
    await navigateTo("Gallery");
    await expect(page).toHaveURL("/gallery");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Club Photo Gallery");

    // Events
    await navigateTo("Events");
    await expect(page).toHaveURL("/events");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Events Calendar");

    // Contact Us
    await navigateTo("Contact Us");
    await expect(page).toHaveURL("/contact");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact Us");
  });

  test("event views: list, month calendar, day schedule, and detail", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Events Calendar");

    // Search filter
    const searchInput = page.getByPlaceholder("Search events by keyword or venue...");
    await searchInput.fill("Garden Walk");
    await expect(page.getByText("2026 Garden Walk Fundraiser").first()).toBeVisible();
    await searchInput.fill("");

    // Switch to month view
    await page.getByRole("link", { name: "Month Calendar" }).click();
    await expect(page).toHaveURL("/events/month");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Events Month Calendar");

    // Switch to day view
    await page.getByRole("link", { name: "Day Schedule" }).click();
    await expect(page).toHaveURL("/events/day");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Event Daily Schedule");

    // Open an event detail
    await page.goto("/event/2026-garden-walk-fundraiser");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("2026 Garden Walk Fundraiser");
    await expect(page.getByText("Saugatuck Douglas Gardens Tour Hub")).toBeVisible();
  });

  test("gallery view opens and navigates keyboard lightbox", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Club Photo Gallery");

    // Click first photo to open lightbox
    const firstPhoto = page.locator("button[aria-haspopup='dialog']").first();
    await firstPhoto.click();

    // Verify modal dialog is visible
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Press Escape to close
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("contact form submits message with confirmation", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contact Us");

    await page.getByLabel("Your Name").fill("Jane Doe");
    await page.getByLabel("Email Address").fill("jane.doe@example.org");
    await page
      .getByLabel("Message")
      .fill("Hello SDGC team! Could you let me know if volunteer signups are open?");

    await page.getByRole("button", { name: "Submit Message" }).click();

    // Confirmation alert
    await expect(page.getByText("Thank you for reaching out!")).toBeVisible();
  });
});
