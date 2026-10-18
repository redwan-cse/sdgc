import { expect, test } from "@playwright/test";

test.describe("Phase 2: Responsive Navigation & Breakpoint Parity", () => {
  const viewports = [
    { name: "Mobile (375px)", width: 375, height: 667, isMobile: true },
    { name: "Tablet iPad Mini (768px)", width: 768, height: 1024, isMobile: false },
    { name: "Tablet iPad Air (820px)", width: 820, height: 1180, isMobile: false },
    { name: "Desktop (1024px)", width: 1024, height: 768, isMobile: false },
  ];

  for (const vp of viewports) {
    test(`renders navigation and account actions correctly on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");

      const header = page.getByRole("banner");
      await expect(header).toBeVisible();

      if (vp.isMobile) {
        // Mobile menu toggle visible
        const menuBtn = page.getByRole("button", { name: /Open main navigation menu/i });
        await expect(menuBtn).toBeVisible();

        // Open mobile menu
        await menuBtn.click();
        const dialog = page.locator("#mobile-navigation");
        await expect(dialog).toBeVisible();

        // Check dialog has links and auth options
        await expect(dialog.getByRole("link", { name: "Home" })).toBeVisible();
        await expect(dialog.getByRole("link", { name: "About Our Club" })).toBeVisible();
        await expect(dialog.getByRole("link", { name: "Member Login" })).toBeVisible();
        await expect(dialog.getByRole("link", { name: "Become A Member" })).toBeVisible();

        // Close mobile menu
        const closeBtn = dialog.getByLabel("Close navigation menu");
        await closeBtn.click();
        await expect(dialog).not.toBeVisible();
      } else {
        // Tablet / Desktop: desktop nav and account actions must BOTH be visible
        await expect(
          header.getByRole("navigation", { name: "Main Site Navigation" }),
        ).toBeVisible();
        await expect(header.getByRole("link", { name: "Home" })).toBeVisible();
        await expect(header.getByRole("link", { name: "Garden Walk" })).toBeVisible();

        // CRITICAL CHECK: Account actions (Login, Join) must NOT disappear at 768px-1023px
        await expect(header.getByRole("link", { name: "Login" })).toBeVisible();
        await expect(header.getByRole("link", { name: "Join" })).toBeVisible();

        // Mobile toggle must be hidden
        await expect(
          page.getByRole("button", { name: /Open main navigation menu/i }),
        ).not.toBeVisible();
      }
    });
  }

  test("mobile dialog cleanly auto-closes when resized to tablet/desktop width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const menuBtn = page.getByRole("button", { name: /Open main navigation menu/i });
    await menuBtn.click();
    const dialog = page.locator("#mobile-navigation");
    await expect(dialog).toBeVisible();

    // Resize viewport to 768px
    await page.setViewportSize({ width: 768, height: 1024 });

    // Dialog should auto-close
    await expect(dialog).not.toBeVisible();
  });
});
