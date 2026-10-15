import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility (WCAG 2.1 AA Audits)", () => {
  const routes = [
    { name: "Home", path: "/" },
    { name: "About Our Club", path: "/aboutourclub" },
    { name: "Garden Walk", path: "/garden-walk" },
    { name: "Gallery", path: "/gallery" },
    { name: "Events Calendar", path: "/events" },
    { name: "Contact", path: "/contact" },
    { name: "Membership Registration", path: "/becomeamember" },
    { name: "Login", path: "/login" },
  ];

  for (const { name, path } of routes) {
    test(`route ${name} (${path}) has no critical or serious accessibility violations`, async ({
      page,
    }) => {
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const criticalOrSerious = accessibilityScanResults.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );

      expect(criticalOrSerious).toEqual([]);
    });
  }
});
