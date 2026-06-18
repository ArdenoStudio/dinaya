import { test, expect } from "@playwright/test";
import { makeAccount, registerViaApi } from "./helpers/auth";
import { createCalendarOverlayTicket } from "../src/lib/calendar-overlay-ticket";

const hasGoogleClient = Boolean(process.env.GOOGLE_CLIENT_ID);
const hasTicketSecret = Boolean(process.env.SECRET_ENCRYPTION_KEY ?? process.env.AUTH_SECRET);

test.describe("Public booking calendar overlay", () => {
  test.skip(!hasGoogleClient, "GOOGLE_CLIENT_ID required for overlay affordance");

  test("service booking page shows calendar overlay control", async ({ page, request }) => {
    const account = makeAccount("calendar-overlay");
    await registerViaApi(request, account);

    await page.goto(`/book/${account.slug}`);
    await page.getByRole("button", { name: /Haircut/i }).click();
    await expect(page.getByText(/Overlay my Google Calendar/i)).toBeVisible();
    await expect(page.getByRole("switch", { name: /Overlay my Google Calendar/i })).toBeVisible();
  });
});

test.describe("Calendar overlay connect page", () => {
  test.skip(
    !hasTicketSecret || !hasGoogleClient,
    "SECRET_ENCRYPTION_KEY or AUTH_SECRET and GOOGLE_CLIENT_ID required",
  );

  test("renders localized connector copy for a valid ticket", async ({ page }) => {
    const { ticket } = createCalendarOverlayTicket("http://127.0.0.1:3001", "en");
    await page.goto(`/calendar-overlay/connect?ticket=${encodeURIComponent(ticket)}`);

    await expect(page.getByRole("heading", { name: /Compare your calendar/i })).toBeVisible();
    await expect(page.getByText(/Read-only availability/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with Google|Loading Google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Cancel/i })).toBeVisible();
  });

  test("returns not found for invalid tickets", async ({ page }) => {
    const response = await page.goto("/calendar-overlay/connect?ticket=invalid");
    expect(response?.status()).toBe(404);
  });
});
