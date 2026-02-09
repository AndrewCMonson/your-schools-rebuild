import { test, expect } from "@playwright/test";

test("home page renders and links to schools", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /School discovery/i })).toBeVisible();
  await page.getByRole("link", { name: /Start Searching/i }).click();
  await expect(page).toHaveURL(/\/schools/);
});
