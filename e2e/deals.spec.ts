import { test, expect } from "@playwright/test";
import {
  makeAccount,
  registerLoginAndSetPlan,
  type TestAccount,
} from "./helpers/auth";

const HAIRCUT_PRICE_LKR = 1500;
const DEAL_DISCOUNT_PERCENT = 20;

function formatLkr(amountLkr: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
  }).format(amountLkr);
}

function computeDiscountedPrice(priceLkr: number, discountPercent: number): number {
  return Math.floor(priceLkr * (1 - discountPercent / 100));
}

function nextWeekdayBookingDate(): { dateStr: string; apptStart: Date; apptEnd: Date } {
  const candidate = new Date();
  candidate.setDate(candidate.getDate() + 1);

  while (candidate.getDay() === 0 || candidate.getDay() === 6) {
    candidate.setDate(candidate.getDate() + 1);
  }

  const pad = (value: number) => String(value).padStart(2, "0");
  const dateStr = `${candidate.getFullYear()}-${pad(candidate.getMonth() + 1)}-${pad(candidate.getDate())}`;

  return {
    dateStr,
    apptStart: new Date(`${dateStr}T09:00:00+05:30`),
    apptEnd: new Date(`${dateStr}T17:00:00+05:30`),
  };
}

test.describe("Deals booking path", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL required for deal E2E");

  let account: TestAccount;

  test.beforeEach(async ({ page, request }) => {
    account = makeAccount("deals");
    await registerLoginAndSetPlan(page, request, account, "pro");

    await page.request.patch("/api/dashboard/directory", {
      data: {
        directoryListed: true,
        directoryCity: "Colombo",
      },
    });
  });

  test("books with dealId and shows discounted price on confirm", async ({ page }) => {
    const [servicesRes, staffRes, locationsRes] = await Promise.all([
      page.request.get("/api/dashboard/services"),
      page.request.get("/api/dashboard/staff"),
      page.request.get("/api/dashboard/locations"),
    ]);

    const services = await servicesRes.json();
    const staffList = await staffRes.json();
    const locations = await locationsRes.json();

    const service = services.find((item: { name: string }) => item.name === "Haircut");
    const staffMember = staffList[0];
    const location = locations[0];

    expect(service).toBeTruthy();
    expect(staffMember).toBeTruthy();
    expect(location).toBeTruthy();

    const { dateStr, apptStart, apptEnd } = nextWeekdayBookingDate();
    const now = new Date();
    const dealWindowStart = new Date(now.getTime() - 60 * 60 * 1000);
    const dealWindowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const dealRes = await page.request.post("/api/dashboard/deals", {
      data: {
        serviceId: service.id,
        staffId: staffMember.id,
        locationId: location.id,
        discountPercent: DEAL_DISCOUNT_PERCENT,
        slotsTotal: 3,
        dealWindowStart: dealWindowStart.toISOString(),
        dealWindowEnd: dealWindowEnd.toISOString(),
        apptWindowStart: apptStart.toISOString(),
        apptWindowEnd: apptEnd.toISOString(),
      },
    });

    expect(dealRes.ok()).toBeTruthy();
    const deal = await dealRes.json();
    expect(deal.id).toBeTruthy();

    const discountedPrice = computeDiscountedPrice(HAIRCUT_PRICE_LKR, DEAL_DISCOUNT_PERCENT);

    await page.goto(`/book/${account.slug}?dealId=${deal.id}`);
    await expect(page.getByText("Deals available")).toBeVisible();
    await expect(page.getByText(`${DEAL_DISCOUNT_PERCENT}% OFF`)).toBeVisible();
    await expect(page.getByText(formatLkr(discountedPrice))).toBeVisible();

    const dayNumber = String(Number(dateStr.split("-")[2]));
    await page.getByRole("button", { name: dayNumber, exact: true }).click();

    const slotButton = page.locator("button").filter({ hasText: /:\d{2}\s*(AM|PM)/i }).first();
    await expect(slotButton).toBeVisible({ timeout: 15_000 });
    await slotButton.click();

    await page.getByRole("button", { name: /Confirm/i }).first().click();

    await expect(page.getByText(formatLkr(discountedPrice)).first()).toBeVisible();
    await expect(page.getByText(formatLkr(HAIRCUT_PRICE_LKR)).first()).toBeVisible();
  });

  test("releases deal slot when pending booking is cancelled", async ({ page, request }) => {
    const [servicesRes, staffRes, locationsRes] = await Promise.all([
      page.request.get("/api/dashboard/services"),
      page.request.get("/api/dashboard/staff"),
      page.request.get("/api/dashboard/locations"),
    ]);

    const services = await servicesRes.json();
    const staffList = await staffRes.json();
    const locations = await locationsRes.json();
    const service = services.find((item: { name: string }) => item.name === "Haircut");
    const staffMember = staffList[0];
    const location = locations[0];
    const { apptStart, apptEnd } = nextWeekdayBookingDate();
    const now = new Date();

    const dealRes = await page.request.post("/api/dashboard/deals", {
      data: {
        serviceId: service.id,
        staffId: staffMember.id,
        locationId: location.id,
        discountPercent: DEAL_DISCOUNT_PERCENT,
        slotsTotal: 1,
        dealWindowStart: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        dealWindowEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        apptWindowStart: apptStart.toISOString(),
        apptWindowEnd: apptEnd.toISOString(),
      },
    });
    const deal = await dealRes.json();

    const bookingRes = await request.post(`/api/bookings`, {
      data: {
        businessSlug: account.slug,
        serviceId: service.id,
        staffId: staffMember.id,
        locationId: location.id,
        startsAt: apptStart.toISOString(),
        clientName: "Deal Slot Test",
        clientPhone: "+94771234567",
        dealId: deal.id,
      },
    });
    expect(bookingRes.ok()).toBeTruthy();
    const booking = await bookingRes.json();

    const cancelRes = await page.request.patch(`/api/dashboard/bookings/${booking.id}`, {
      data: { status: "cancelled" },
    });
    expect(cancelRes.ok()).toBeTruthy();

    await page.goto(`/book/${account.slug}?dealId=${deal.id}`);
    await expect(page.getByText("Deals available")).toBeVisible();
    await expect(page.getByText(`${DEAL_DISCOUNT_PERCENT}% OFF`)).toBeVisible();
  });
});
