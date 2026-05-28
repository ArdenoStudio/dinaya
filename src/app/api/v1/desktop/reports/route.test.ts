import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getReportsDashboardOverviewMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/reports", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dashboard/reports")>();
  return {
    ...actual,
    getReportsDashboardOverview: getReportsDashboardOverviewMock,
  };
});

import { GET } from "./route";

describe("GET /api/v1/desktop/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/reports");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(getReportsDashboardOverviewMock).not.toHaveBeenCalled();
  });

  it("returns reports data with normalized range and export", async () => {
    getReportsDashboardOverviewMock.mockResolvedValue({
      breakdowns: {
        bookingsBySource: [{ label: "public", value: 4 }],
        bookingsByStatus: [{ label: "completed", value: 3 }],
        revenueByDay: [{ label: "2026-05-28", value: 2500 }],
        revenueByService: [{ label: "Haircut", value: 2500 }],
        staffLoad: [{ label: "Ashan", value: 4 }],
        topClients: [{ label: "Kasun", value: 2500 }],
      },
      business: { id: "biz_1", name: "Salon", timezone: "Asia/Colombo" },
      export: {
        csv: "Metric,Value\nRevenue,2500",
        filename: "dinaya-reports.csv",
        generatedAt: "2026-05-28T09:00:00.000Z",
      },
      metrics: {
        averageRating: 4.7,
        cancellationRate: 10,
        cancelledBookings: 1,
        completedBookings: 3,
        newClients: 2,
        noShowRate: 0,
        noShows: 0,
        totalBookings: 4,
        totalRevenueLabel: "LKR 2,500",
        totalRevenueLkr: 2500,
      },
      range: { from: "2026-05-01", to: "2026-05-28" },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/reports?from=2026-05-01&to=2026-05-28");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/reports");
    expect(body.metrics.totalRevenueLkr).toBe(2500);
    expect(body.export.filename).toBe("dinaya-reports.csv");
    expect(body.serverTime).toEqual(expect.any(String));
    expect(getReportsDashboardOverviewMock).toHaveBeenCalledWith("biz_1", {
      from: "2026-05-01",
      to: "2026-05-28",
    });
  });

  it("applies desktop reports rate limit", async () => {
    withRateLimitMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Too many requests" }, { status: 429 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/reports");
    const res = await GET(req);

    expect(res.status).toBe(429);
    expect(getReportsDashboardOverviewMock).not.toHaveBeenCalled();
  });
});
