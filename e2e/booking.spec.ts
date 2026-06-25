import { test, expect } from "@playwright/test";
import {
  makeAccount,
  nextBookableDate,
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

  test("completes a free booking through confirm", async ({ page }) => {
    await page.goto(`/book/${account.slug}`);
    await page.getByRole("button", { name: /Haircut/i }).click();

    const dateStr = nextBookableDate();
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.count()) {
      await dateInput.first().fill(dateStr);
    }

    const slotButton = page
      .locator("button")
      .filter({ hasText: /^\d{1,2}:\d{2}\s*(am|pm)?$/i })
      .first();
    await expect(slotButton).toBeVisible({ timeout: 25_000 });
    await slotButton.click();

    await page.getByLabel(/Full name/i).fill("Test Client");
    await page.getByLabel(/Phone number/i).fill("+94771234567");
    await page.getByRole("button", { name: /Confirm booking/i }).click();
    await expect(page).toHaveURL(new RegExp(`/book/${account.slug}/confirmed`));
    await expect(page.getByText(/Booking confirmed|Booking request received/i)).toBeVisible();
  });

  test("desktop booker shows time slots in the right column", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/book/${account.slug}`);
    await page.getByRole("button", { name: /Haircut/i }).click();

    const dateStr = nextBookableDate();
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.count()) {
      await dateInput.first().fill(dateStr);
    }

    const slotButtons = page.locator("button").filter({ hasText: /^\d{1,2}:\d{2}\s*(am|pm)?$/i });
    await expect(slotButtons.first()).toBeVisible({ timeout: 25_000 });
    expect(await slotButtons.count()).toBeGreaterThanOrEqual(3);

    await expect(page.getByText(/Fully booked on this date/i)).not.toBeVisible();
    await expect(page.getByText("Available times")).toBeVisible();
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
