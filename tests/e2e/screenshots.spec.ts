import fs from "node:fs";
import path from "node:path";
import { test } from "@playwright/test";

const surfaces = [
  { name: "public-home", path: "/" },
  { name: "public-events", path: "/events" },
  { name: "public-gallery", path: "/gallery" },
  { name: "public-garden-walk", path: "/garden-walk" },
  { name: "auth-login", path: "/login" },
  { name: "auth-register", path: "/becomeamember" },
  { name: "admin-overview", path: "/admin" },
];

test.describe("Capture Phase 2 milestone screenshots", () => {
  test.beforeAll(() => {
    fs.mkdirSync(path.join(process.cwd(), "artifacts", "phase-02"), { recursive: true });
  });

  for (const surface of surfaces) {
    test(`capture ${surface.name}`, async ({ page }, testInfo) => {
      await page.goto(surface.path);
      await page.waitForLoadState("domcontentloaded");
      // Wait for any animations/hydration
      await page.waitForTimeout(300);
      const project = testInfo.project.name;
      const targetFilename =
        project === "chromium" ? `${surface.name}.png` : `${surface.name}-${project}.png`;
      const filePath = path.join(process.cwd(), "artifacts", "phase-02", targetFilename);
      await page.screenshot({ path: filePath, fullPage: true });
    });
  }
});
