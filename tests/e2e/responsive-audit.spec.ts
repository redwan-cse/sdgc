import fs from "node:fs";
import path from "node:path";
import { type Page, test } from "@playwright/test";

const outputDir = path.join(process.cwd(), "artifacts", "responsive-audit");

const devices = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
];

const publicPages = [
  { id: "01-home", url: "/" },
  { id: "02-about", url: "/about" },
  { id: "03-garden-walk", url: "/garden-walk" },
  { id: "04-events", url: "/events" },
  { id: "05-event-detail", url: "/event/47th-annual-garden-walk-fundraiser" },
  { id: "06-gallery", url: "/gallery" },
  { id: "07-contact", url: "/contact" },
  { id: "08-membership", url: "/membership" },
  { id: "09-join", url: "/join" },
  { id: "10-login", url: "/login" },
  { id: "11-tickets", url: "/tickets-checkout" },
];

const adminPages = [
  { id: "12-admin-overview", url: "/admin" },
  { id: "13-admin-members", url: "/admin/members" },
  { id: "14-admin-dues", url: "/admin/dues" },
  { id: "15-admin-events", url: "/admin/events" },
  { id: "16-admin-media", url: "/admin/media" },
  { id: "17-admin-content", url: "/admin/content" },
  { id: "18-admin-messages", url: "/admin/messages" },
  { id: "19-admin-settings", url: "/admin/settings" },
];

const memberPages = [
  { id: "20-member-directory", url: "/directory" },
  { id: "21-member-profile", url: "/profile" },
  { id: "22-member-dues", url: "/dues" },
];

async function loadAndCapturePage(page: Page, url: string, filePath: string) {
  const currentUrl = new URL(page.url());
  if (currentUrl.pathname !== url) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
  }
  // Scroll down page to trigger all next/image lazy loaders
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 350;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 30);
    });
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({
    path: filePath,
    fullPage: true,
  });
}

test.describe("Multi-device Responsive Screenshot Audit", () => {
  test.setTimeout(180_000);

  test.beforeAll(() => {
    fs.mkdirSync(outputDir, { recursive: true });
  });

  for (const device of devices) {
    test(`capture public pages on ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      for (const p of publicPages) {
        await loadAndCapturePage(page, p.url, path.join(outputDir, `${p.id}-${device.name}.png`));
      }
    });

    test(`capture member pages on ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      // Login as active member
      await page.goto("/login");
      await page.getByLabel("Username or Email Address").fill("member@sdgc.local");
      await page.getByLabel("Password").fill("Password123!");
      await page.getByRole("button", { name: "Sign In to Member Area" }).click();
      await page.waitForURL(/\/(directory|profile)/, { timeout: 15_000 });

      for (const p of memberPages) {
        await loadAndCapturePage(page, p.url, path.join(outputDir, `${p.id}-${device.name}.png`));
      }
    });

    test(`capture admin pages on ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      // Login as admin
      await page.goto("/login?returnTo=/admin");
      await page.getByLabel("Username or Email Address").fill("admin@sdgc.local");
      await page.getByLabel("Password").fill("Password123!");
      await page.getByRole("button", { name: "Sign In to Member Area" }).click();
      await page.waitForURL(/\/admin$/, { timeout: 15_000 });
      await page.waitForSelector("text=Active Members", { timeout: 15_000 }).catch(() => {});

      for (const p of adminPages) {
        await loadAndCapturePage(page, p.url, path.join(outputDir, `${p.id}-${device.name}.png`));
      }
    });
  }
});
