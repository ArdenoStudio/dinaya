import { expect, test } from "@playwright/test";
import {
  enablePayhereForFirstService,
  makeAccount,
  registerAndLogin,
  registerViaApi,
} from "./helpers/auth";

test.describe("Booking payments", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required to seed PayHere settings.");

  test("returns PayHere checkout data for a paid booking", async ({ request }) => {
    const account = makeAccount("payment-checkout");
    await registerViaApi(request, account);
    const seeded = await enablePayhereForFirstService(account.email);
    const startsAt = new Date();
    startsAt.setUTCDate(startsAt.getUTCDate() + 3);
    startsAt.setUTCHours(5, 30, 0, 0);
    const endsAt = new Date(startsAt.getTime() + 30 * 60_000);

    const response = await request.post("/api/bookings", {
      data: {
        businessId: seeded.businessId,
        clientName: "Payment Client",
        clientPhone: "0771234567",
        endsAt: endsAt.toISOString(),
        locationId: seeded.locationId,
        serviceId: seeded.serviceId,
        staffId: seeded.staffId,
        startsAt: startsAt.toISOString(),
      },
    });

    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.bookingId).toBeTruthy();
    expect(body.payhereUrl).toContain("payhere.lk");
    expect(body.payhereFormData.order_id).toBeTruthy();
    expect(body.payhereFormData.notify_url).toContain("/api/webhooks/payhere");
  });
});

test.describe("Payments dashboard", () => {
  test("shows PayHere payment records page for Free users", async ({ page, request }) => {
    const account = makeAccount("payments-free");
    await registerAndLogin(page, request, account);

    await page.goto("/dashboard/payments");

    await expect(page.getByRole("heading", { name: "Payments" })).toBeVisible();
    await expect(page.getByText(/No payment records yet/i)).toBeVisible();
  });
});
