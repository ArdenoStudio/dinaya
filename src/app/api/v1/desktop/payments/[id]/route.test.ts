import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getPaymentDashboardDetailMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/payments", () => ({
  getPaymentDashboardDetail: getPaymentDashboardDetailMock,
}));

import { GET } from "./route";

describe("GET /api/v1/desktop/payments/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1" },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/payments/payment_1");
    const res = await GET(req, { params: Promise.resolve({ id: "payment_1" }) });

    expect(res.status).toBe(401);
    expect(getPaymentDashboardDetailMock).not.toHaveBeenCalled();
  });

  it("returns 404 for a payment outside the tenant", async () => {
    getPaymentDashboardDetailMock.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/desktop/payments/payment_1");
    const res = await GET(req, { params: Promise.resolve({ id: "payment_1" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found.");
    expect(getPaymentDashboardDetailMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "payment_1");
  });

  it("returns payment and booking context", async () => {
    getPaymentDashboardDetailMock.mockResolvedValue({
      booking: {
        clientEmail: "kasun@example.com",
        clientName: "Kasun",
        clientPhone: "+94770000000",
        endsAt: "2026-05-28T09:45:00.000Z",
        id: "booking_1",
        locationName: "Kandy",
        serviceName: "Haircut",
        staffName: "Ashan",
        startsAt: "2026-05-28T09:00:00.000Z",
        status: "confirmed",
      },
      payment: {
        amountLkr: 2500,
        createdAt: "2026-05-28T08:50:00.000Z",
        id: "payment_1",
        orderId: "DINAYA-123",
        receiptSentAt: null,
        status: "success",
      },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/payments/payment_1");
    const res = await GET(req, { params: Promise.resolve({ id: "payment_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/bookings/booking_1");
    expect(body.payment).toMatchObject({ id: "payment_1", amountLkr: 2500, status: "success" });
    expect(body.booking).toMatchObject({ id: "booking_1", clientName: "Kasun" });
    expect(body.serverTime).toEqual(expect.any(String));
  });
});
