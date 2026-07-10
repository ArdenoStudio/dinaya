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

    const primary = page.getByRole("navigation", { name: "Primary" });
    await expect(primary).toBeVisible();
    await expect(primary.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(primary.getByRole("link", { name: "Calendar" })).toBeVisible();
    await expect(primary.getByRole("link", { name: "Bookings" })).toBeVisible();
    await expect(primary.getByRole("link", { name: "Clients" })).toBeVisible();
    await expect(primary.getByRole("button", { name: "More" })).toBeVisible();

    await primary.getByRole("button", { name: "More" }).click();
    const moreSheet = page.getByRole("dialog", { name: /More dashboard pages/i });
    await expect(moreSheet).toBeVisible();
    await expect(moreSheet.getByText(/Account/i)).toBeVisible();
    await expect(moreSheet.getByRole("button", { name: /Sign out/i })).toBeVisible();
    await moreSheet.getByRole("link", { name: /Services/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/services/);

    await primary.getByRole("link", { name: "Calendar" }).click();
    await expect(page).toHaveURL(/\/dashboard\/calendar/);
    await expect(page.getByRole("button", { name: /day/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /New booking/i })).toBeVisible();
  });
});
