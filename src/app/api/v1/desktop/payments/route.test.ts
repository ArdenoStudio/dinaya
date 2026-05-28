import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getPaymentsDashboardListMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/payments", () => ({
  getPaymentsDashboardList: getPaymentsDashboardListMock,
  isDashboardPaymentStatus: (value: string) => ["pending", "success", "failed", "refunded"].includes(value),
}));

import { GET } from "./route";

describe("GET /api/v1/desktop/payments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
    getPaymentsDashboardListMock.mockResolvedValue({
      filters: { limit: 80, q: "", status: "all" },
      rows: [
        {
          amountLkr: 2500,
          bookingId: "booking_1",
          bookingStatus: "confirmed",
          clientName: "Kasun",
          clientPhone: "+94770000000",
          createdAt: "2026-05-28T08:50:00.000Z",
          id: "payment_1",
          locationName: "Kandy",
          orderId: "DINAYA-123",
          receiptSentAt: null,
          serviceName: "Haircut",
          staffName: "Ashan",
          startsAt: "2026-05-28T09:00:00.000Z",
          status: "success",
          webUrl: "/dashboard/bookings/booking_1",
        },
      ],
      summary: {
        failedPayments: 0,
        pendingPayments: 1,
        refundedPayments: 0,
        successfulPayments: 4,
        successfulRevenueLkr: 10000,
        totalPayments: 5,
      },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/payments");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(getPaymentsDashboardListMock).not.toHaveBeenCalled();
  });

  it("returns filtered payments with summary metrics", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/payments?status=success&q=kasun&limit=20");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getPaymentsDashboardListMock).toHaveBeenCalledWith("biz_1", {
      limit: 20,
      q: "kasun",
      status: "success",
    });
    expect(body.webUrl).toBe("/dashboard/payments");
    expect(body.rows).toHaveLength(1);
    expect(body.summary.successfulRevenueLkr).toBe(10000);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("rejects invalid status filters", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/payments?status=cancelled");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("status is invalid.");
    expect(getPaymentsDashboardListMock).not.toHaveBeenCalled();
  });

  it("clamps invalid limits to the default", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/payments?limit=nope");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(getPaymentsDashboardListMock).toHaveBeenCalledWith("biz_1", expect.objectContaining({
      limit: 80,
    }));
  });
});
