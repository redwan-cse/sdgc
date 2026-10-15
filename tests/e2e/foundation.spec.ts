import { expect, test } from "@playwright/test";

test("foundation renders the supplied identity without database credentials", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Saugatuck Douglas Garden Club");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Saugatuck Douglas Garden Club");
  await expect(page.getByRole("img", { name: "Saugatuck Douglas Garden Club logo" })).toBeVisible();
  await expect(page.getByRole("main")).toHaveAttribute("id", "main-content");
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(hasOverflow).toBe(false);
});

test("unknown routes return an accessible 404", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "Return home" }).click();
  await expect(page).toHaveURL("/");
});
