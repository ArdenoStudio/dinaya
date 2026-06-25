import { test, expect } from "@playwright/test";
import {
  makeAccount,
  registerLoginAsStarter,
  registerLoginAndSetPlan,
} from "./helpers/auth";

test.describe("Locations — Starter plan", () => {
  test.beforeEach(async ({ page, request }) => {
    const account = makeAccount("loc-free");
    await registerLoginAsStarter(page, request, account);
    await page.goto("/dashboard/locations");
    await expect(page.getByRole("heading", { name: "Locations" })).toBeVisible();
    await expect(page.getByText(/\/1 on Starter plan/i)).toBeVisible({ timeout: 15_000 });
  });

  test("shows 1/1 location limit on Starter plan", async ({ page }) => {
    await expect(page.getByText(/1\/1 on Starter plan/i)).toBeVisible();
  });

  test("hides Add location button at Starter plan limit", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Add location/i })).not.toBeVisible();
  });

  test("shows upgrade prompt at limit", async ({ page }) => {
    await expect(page.getByText(/reached your plan limit/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Upgrade/i })).toBeVisible();
  });

  test("lists default location from registration", async ({ page, request }) => {
    const account = makeAccount("loc-default-name");
    await registerLoginAsStarter(page, request, account);
    await page.goto("/dashboard/locations");
    await expect(page.getByText(account.businessName)).toBeVisible();
  });
});

test.describe("Locations — Pro plan", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required to set Pro plan");

  test.beforeEach(async ({ page, request }) => {
    const account = makeAccount("loc-pro");
    await registerLoginAndSetPlan(page, request, account, "pro");
    await page.goto("/dashboard/locations");
    await expect(page.getByText(/\/1 on Pro plan/i)).toBeVisible({ timeout: 15_000 });
  });

  test("hides Add location button at Pro plan limit", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Add location/i })).not.toBeVisible();
    await expect(page.getByText(/reached your plan limit/i)).toBeVisible();
  });

  test("shows staff count on location row", async ({ page }) => {
    await expect(page.getByText(/\d+ staff/i).first()).toBeVisible();
  });
});
