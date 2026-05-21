import { test, expect } from "@playwright/test";
import {
  makeAccount,
  registerLoginAndSetPlan,
  registerViaApi,
  type TestAccount,
} from "./helpers/auth";

test.describe("Public booking — single location", () => {
  let account: TestAccount;

  test.beforeEach(async ({ request }) => {
    account = makeAccount("book-single");
    await registerViaApi(request, account);
  });

  test("does not show branch picker for single-location business", async ({ page }) => {
    await page.goto(`/book/${account.slug}`);
    await expect(page.getByText("Choose a branch")).not.toBeVisible();
  });

  test("shows services on booking page", async ({ page }) => {
    await page.goto(`/book/${account.slug}`);
    await expect(page.getByText("Haircut")).toBeVisible();
  });
});

test.describe("Public booking — multi-location (Pro)", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required to set Pro plan");

  let account: TestAccount;

  test.beforeEach(async ({ page, request }) => {
    account = makeAccount("book-multi");
    await registerLoginAndSetPlan(page, request, account, "pro");
    await page.goto("/dashboard/locations");
    await page.getByRole("button", { name: /Add location/i }).click();
    await page.getByPlaceholder("Colombo 7 branch").fill("Branch Two");
    await page.getByRole("button", { name: /^Create$/i }).click();
    await expect(page.getByText("Branch Two")).toBeVisible();
  });

  test("shows branch picker when multiple locations exist", async ({ page }) => {
    await page.goto(`/book/${account.slug}`);
    await expect(page.getByText("Choose a branch")).toBeVisible();
  });

  test("can select a branch and see services", async ({ page }) => {
    await page.goto(`/book/${account.slug}`);
    await page.getByRole("button", { name: /Branch Two/i }).click();
    await expect(page.getByText("Haircut")).toBeVisible();
  });
});
