import { expect, test } from "@playwright/test";
import { makeAccount, registerAndLogin } from "./helpers/auth";

test.describe("Dashboard mobile UX", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("bottom nav and calendar day view are usable", async ({ page, request }) => {
    const account = makeAccount("mobile");
    await registerAndLogin(page, request, account);

    // May land on setup — complete quickly if needed
    if (page.url().includes("/dashboard/setup")) {
      await page.getByLabel(/WhatsApp/i).fill("+94771234567");
      await page.getByRole("button", { name: /Save & add your first service/i }).click();
      await page.getByRole("button", { name: /Save service & set hours/i }).click();
      await page.getByRole("button", { name: /Confirm hours|Save hours/i }).click();
      await page.getByRole("button", { name: /Open my dashboard/i }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    }

    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await page.getByRole("link", { name: "Calendar" }).click();
    await expect(page).toHaveURL(/\/dashboard\/calendar/);
    await expect(page.getByRole("button", { name: /day/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /New booking/i })).toBeVisible();
  });
});
