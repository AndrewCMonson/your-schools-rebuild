import { test, expect } from "@playwright/test";

test("schools list renders cards", async ({ page }) => {
  await page.goto("/schools");
  await expect(page.getByRole("heading", { name: "Search Schools" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Profile" }).first()).toBeVisible();
});

test("profile route redirects anonymous users to login", async ({ page }) => {
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login/);
});

test("admin user can login and access admin console", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("admin@yourschools.co");
  await page.getByLabel("Password").fill("ChangeMe123!");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/schools/);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Admin Console" })).toBeVisible();
});

test("school admin can login and access school portal", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("schooladmin@yourschools.co");
  await page.getByLabel("Password").fill("ChangeMe123!");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/schools/);
  await page.goto("/portal");
  await expect(page.getByRole("heading", { name: "School Portal" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Manage school" }).first()).toBeVisible();
});

test("compare workflow is reachable from search results", async ({ page }) => {
  await page.goto("/schools");
  await page.getByRole("button", { name: "Compare" }).nth(1).click();
  await expect(page).toHaveURL(/\/compare\?ids=/);
  await expect(page.getByRole("heading", { name: "School Compare" })).toBeVisible();
});
