import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const requireDesktopWriteMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getServiceDashboardDetailMock = vi.hoisted(() => vi.fn());
const updateServiceDashboardFieldsMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
  requireDesktopWrite: requireDesktopWriteMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/services", () => ({
  getServiceDashboardDetail: getServiceDashboardDetailMock,
  updateServiceDashboardFields: updateServiceDashboardFieldsMock,
}));

import { GET, PATCH } from "./route";

describe("GET /api/v1/desktop/services/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
    requireDesktopWriteMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/services/service_1");
    const res = await GET(req, { params: Promise.resolve({ id: "service_1" }) });

    expect(res.status).toBe(401);
    expect(getServiceDashboardDetailMock).not.toHaveBeenCalled();
  });

  it("returns 404 for a service outside the tenant", async () => {
    getServiceDashboardDetailMock.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/desktop/services/service_1");
    const res = await GET(req, { params: Promise.resolve({ id: "service_1" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found.");
    expect(getServiceDashboardDetailMock).toHaveBeenCalledWith("biz_1", "service_1");
  });

  it("returns service details, assigned staff, and recent bookings", async () => {
    getServiceDashboardDetailMock.mockResolvedValue({
      service: {
        afterBuffer: 10,
        beforeBuffer: 5,
        createdAt: "2026-05-01T00:00:00.000Z",
        dailyCapacity: 8,
        depositPercent: 25,
        description: "Classic cut",
        durationMinutes: 45,
        id: "service_1",
        isActive: true,
        minimumNoticeHours: 2,
        name: "Haircut",
        priceLkr: 2500,
        requiresPayment: true,
      },
      assignedStaff: [
        { id: "staff_1", isActive: true, name: "Ashan", priceOverrideLkr: null },
      ],
      recentBookings: [
        {
          clientName: "Kasun",
          id: "booking_1",
          staffName: "Ashan",
          startsAt: "2026-05-28T09:00:00.000Z",
          status: "confirmed",
        },
      ],
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/services/service_1");
    const res = await GET(req, { params: Promise.resolve({ id: "service_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/services/service_1");
    expect(body.service).toMatchObject({ id: "service_1", name: "Haircut" });
    expect(body.assignedStaff).toHaveLength(1);
    expect(body.recentBookings).toHaveLength(1);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("updates basic service fields through the desktop write bridge", async () => {
    updateServiceDashboardFieldsMock.mockResolvedValue({
      status: "updated",
      service: { id: "service_1", name: "Haircut Pro" },
    });
    getServiceDashboardDetailMock.mockResolvedValue({
      service: {
        afterBuffer: 10,
        beforeBuffer: 5,
        createdAt: "2026-05-01T00:00:00.000Z",
        dailyCapacity: 8,
        depositPercent: 25,
        description: "Classic cut",
        durationMinutes: 60,
        id: "service_1",
        isActive: true,
        minimumNoticeHours: 2,
        name: "Haircut Pro",
        priceLkr: 3000,
        requiresPayment: true,
      },
      assignedStaff: [],
      recentBookings: [],
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/services/service_1", {
      body: JSON.stringify({
        durationMinutes: 60,
        isActive: true,
        name: "Haircut Pro",
        priceLkr: 3000,
      }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "service_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(updateServiceDashboardFieldsMock).toHaveBeenCalledWith("biz_1", "service_1", expect.objectContaining({
      durationMinutes: 60,
      isActive: true,
      name: "Haircut Pro",
      priceLkr: 3000,
    }));
    expect(body.service).toMatchObject({ id: "service_1", name: "Haircut Pro", priceLkr: 3000 });
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("returns conflict when deactivation would hide a service with future bookings", async () => {
    updateServiceDashboardFieldsMock.mockResolvedValue({
      status: "future_bookings",
      error: "This service has future bookings.",
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/services/service_1", {
      body: JSON.stringify({ isActive: false }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "service_1" }) });
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("This service has future bookings.");
  });

  it("rejects malformed desktop service updates", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/services/service_1", {
      body: JSON.stringify({ durationMinutes: 1 }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "service_1" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Please check the service details.");
    expect(updateServiceDashboardFieldsMock).not.toHaveBeenCalled();
  });
});
