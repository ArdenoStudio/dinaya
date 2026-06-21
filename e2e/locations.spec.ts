import { test, expect } from "@playwright/test";
import {
  makeAccount,
  registerLoginAsStarter,
  registerLoginAndSetPlan,
} from "./helpers/auth";

test.describe("Locations — Free plan", () => {
  test.beforeEach(async ({ page, request }) => {
    const account = makeAccount("loc-free");
    await registerLoginAsStarter(page, request, account);
    await page.goto("/dashboard/locations");
    await expect(page.getByRole("heading", { name: "Locations" })).toBeVisible();
  });

  test("shows 1/1 location limit on Free plan", async ({ page }) => {
    await expect(page.getByText(/1\/1 on Free plan/i)).toBeVisible();
  });

  test("hides Add location button at Free plan limit", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Add location/i })).not.toBeVisible();
  });

  test("shows upgrade prompt at limit", async ({ page }) => {
    await expect(page.getByText(/reached your plan limit/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Upgrade/i })).toBeVisible();
  });

  test("lists default location from registration", async ({ page }) => {
    await expect(page.getByText("Default")).toBeVisible();
  });
});

test.describe("Locations — Pro plan", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required to set Pro plan");

  test.beforeEach(async ({ page, request }) => {
    const account = makeAccount("loc-pro");
    await registerLoginAndSetPlan(page, request, account, "pro");
    await page.goto("/dashboard/locations");
    await expect(page.getByText(/on Pro plan/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("shows Add location button on Pro", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Add location/i })).toBeVisible();
  });

  test("creates a new branch", async ({ page }) => {
    await page.getByRole("button", { name: /Add location/i }).click();
    await page.getByPlaceholder("Colombo 7 branch").fill("Kandy Branch");
    await page.getByRole("button", { name: /^Create$/i }).click();
    await expect(page.getByText("Kandy Branch")).toBeVisible();
  });

  test("can set another branch as default", async ({ page }) => {
    await page.getByRole("button", { name: /Add location/i }).click();
    await page.getByPlaceholder("Colombo 7 branch").fill("Galle Branch");
    await page.getByRole("button", { name: /^Create$/i }).click();
    await expect(page.getByText("Galle Branch")).toBeVisible();

    const row = page.locator("div").filter({ hasText: "Galle Branch" }).first();
    await row.getByRole("button", { name: /Set default/i }).click();
    await expect(page.getByText("Galle Branch").locator("..").getByText("Default")).toBeVisible();
  });

  test("can deactivate a non-default branch", async ({ page }) => {
    await page.getByRole("button", { name: /Add location/i }).click();
    await page.getByPlaceholder("Colombo 7 branch").fill("Temp Branch");
    await page.getByRole("button", { name: /^Create$/i }).click();
    await expect(page.getByText("Temp Branch")).toBeVisible();

    const row = page.locator("div").filter({ hasText: "Temp Branch" }).first();
    await row.getByRole("button", { name: /Deactivate/i }).click();
    await expect(page.getByText("Inactive")).toBeVisible();
  });

  test("shows staff count on location row", async ({ page }) => {
    await expect(page.getByText(/\d+ staff/i).first()).toBeVisible();
  });
});
