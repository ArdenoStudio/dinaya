import { test, expect } from "@playwright/test";
import { format } from "date-fns";
import {
  makeAccount,
  registerLoginAndSetPlan,
  type TestAccount,
} from "./helpers/auth";

test.describe("Booking flow — dashboard and public page", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required for Max plan booking flow");

  let account: TestAccount;
  const clientName = "E2E Booking Client";
  const clientPhone = "+94771234567";

  test.beforeEach(async ({ page, request }) => {
    account = makeAccount("book-flow");
    await registerLoginAndSetPlan(page, request, account, "max");
  });

  test("owner creates a booking from the dashboard", async ({ page }) => {
    const today = format(new Date(), "yyyy-MM-dd");

    await page.goto("/dashboard/bookings/new");
    await expect(page.getByRole("heading", { name: "New booking" })).toBeVisible();

    await page.getByRole("button", { name: "Haircut" }).click();
    await page.getByRole("button", { name: account.name }).click();

    await page.locator('input[type="date"]').fill(today);
    await expect(page.getByText(/Loading slots/i)).not.toBeVisible({ timeout: 15_000 });

    const firstSlot = page.locator('button[type="button"]').filter({ hasText: /^\d{1,2}:\d{2}/ }).first();
    await expect(firstSlot).toBeVisible({ timeout: 15_000 });
    await firstSlot.click();

    await page.getByLabel("Name *").fill(clientName);
    await page.getByLabel("Phone *").fill(clientPhone);
    await page.getByRole("button", { name: "Confirm booking" }).click();

    await page.waitForURL("**/dashboard/bookings/**");
    await expect(page.getByText(clientName)).toBeVisible();
  });

  test("public booking page completes a booking end-to-end", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/book/${account.slug}`);

    await page.getByRole("button", { name: "Haircut" }).click();

    const slotButton = page
      .locator("button")
      .filter({ hasText: /^\d{1,2}:\d{2}\s*(am|pm)?$/i })
      .first();
    await expect(slotButton).toBeVisible({ timeout: 15_000 });
    await slotButton.click();

    await page.getByRole("button", { name: /Confirm & Pay/i }).click();

    await page.getByPlaceholder("Nimal Perera").fill("Public E2E Client");
    await page.getByPlaceholder("+94 77 123 4567").fill("+94777654321");
    await page.getByRole("button", { name: "Confirm booking" }).click();

    await expect(page.getByText(/Booking confirmed|Booking request received/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("dashboard bookings list shows the public booking", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/book/${account.slug}`);
    await page.getByRole("button", { name: "Haircut" }).click();

    const slotButton = page
      .locator("button")
      .filter({ hasText: /^\d{1,2}:\d{2}\s*(am|pm)?$/i })
      .first();
    await expect(slotButton).toBeVisible({ timeout: 15_000 });
    await slotButton.click();
    await page.getByRole("button", { name: /Confirm & Pay/i }).click();
    await page.getByPlaceholder("Nimal Perera").fill("List Check Client");
    await page.getByPlaceholder("+94 77 123 4567").fill("+94770000001");
    await page.getByRole("button", { name: "Confirm booking" }).click();
    await expect(page.getByText(/Booking confirmed|Booking request received/i)).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/dashboard/bookings");
    await expect(page.getByText("List Check Client")).toBeVisible({ timeout: 15_000 });
  });
});
