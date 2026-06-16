import { test, expect } from "@playwright/test";
import { makeAccount, registerViaApi } from "./helpers/auth";

test.describe("Client booking manage", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required for booking APIs");

  test("reschedule flow exposes wizard-style slot picker", async ({ page, request }) => {
    const account = makeAccount("reschedule-flow");
    await registerViaApi(request, account);

    await page.goto(`/book/${account.slug}`);
    await page.getByRole("button", { name: /Haircut/i }).click();
    await page.getByRole("button", { name: /9:00 AM|9:30 AM|10:00 AM/i }).first().click();
    await page.getByLabel(/Full name/i).fill("Reschedule Client");
    await page.getByLabel(/Phone number/i).fill("+94777654321");
    await page.getByRole("button", { name: /Confirm booking/i }).click();
    await expect(page).toHaveURL(new RegExp(`/book/${account.slug}/confirmed`));

    const manageLink = page.getByRole("link", { name: /Manage your booking/i });
    await expect(manageLink).toBeVisible();
    await manageLink.click();

    await page.getByRole("button", { name: /Reschedule/i }).click();
    await expect(page.getByText(/Choose a new time/i)).toBeVisible();
    await expect(page.getByText(/Available times/i)).toBeVisible();
  });
});
