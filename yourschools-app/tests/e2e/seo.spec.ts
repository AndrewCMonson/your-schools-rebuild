import { test, expect } from "@playwright/test";

test("home page has basic SEO tags", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/YourSchools/i);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Search and compare/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /localhost:3000\/?$/);
  await expect(page.locator('script[type="application/ld\\+json"]')).toHaveCount(2);
});

test("auth pages are noindex", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
});
