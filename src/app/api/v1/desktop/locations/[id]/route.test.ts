import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const requireDesktopWriteMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getLocationDashboardDetailMock = vi.hoisted(() => vi.fn());
const updateLocationDashboardFieldsMock = vi.hoisted(() => vi.fn());

function validLocationPatch(value: unknown) {
  if (!value || typeof value !== "object") return { success: false };
  const input = value as { isActive?: unknown; name?: unknown; timezone?: unknown };
  if (input.name !== undefined && typeof input.name !== "string") return { success: false };
  if (input.timezone !== undefined && typeof input.timezone !== "string") return { success: false };
  if (input.isActive !== undefined && typeof input.isActive !== "boolean") return { success: false };
  return { success: true, data: value };
}

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
  requireDesktopWrite: requireDesktopWriteMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/locations", () => ({
  getLocationDashboardDetail: getLocationDashboardDetailMock,
  locationDashboardUpdateSchema: { safeParse: validLocationPatch },
  updateLocationDashboardFields: updateLocationDashboardFieldsMock,
}));

import { GET, PATCH } from "./route";

describe("GET /api/v1/desktop/locations/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1" },
    });
    requireDesktopWriteMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1" },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/locations/location_1");
    const res = await GET(req, { params: Promise.resolve({ id: "location_1" }) });

    expect(res.status).toBe(401);
    expect(getLocationDashboardDetailMock).not.toHaveBeenCalled();
  });

  it("returns 404 for a location outside the tenant", async () => {
    getLocationDashboardDetailMock.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/desktop/locations/location_1");
    const res = await GET(req, { params: Promise.resolve({ id: "location_1" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found.");
    expect(getLocationDashboardDetailMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "location_1");
  });

  it("returns location details, assigned staff, and recent bookings", async () => {
    getLocationDashboardDetailMock.mockResolvedValue({
      assignedStaff: [
        { id: "staff_1", isActive: true, isPrimary: true, name: "Ashan" },
      ],
      location: {
        address: "Kandy",
        createdAt: "2026-05-01T00:00:00.000Z",
        id: "location_1",
        isActive: true,
        isDefault: true,
        name: "Main branch",
        phone: "+94770000000",
        slug: "main",
        sortOrder: 0,
        timezone: "Asia/Colombo",
      },
      recentBookings: [
        {
          clientName: "Kasun",
          id: "booking_1",
          serviceName: "Haircut",
          staffName: "Ashan",
          startsAt: "2026-05-28T09:00:00.000Z",
          status: "confirmed",
        },
      ],
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/locations/location_1");
    const res = await GET(req, { params: Promise.resolve({ id: "location_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/locations");
    expect(body.location).toMatchObject({ id: "location_1", name: "Main branch" });
    expect(body.assignedStaff).toHaveLength(1);
    expect(body.recentBookings).toHaveLength(1);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("updates a location and returns refreshed detail", async () => {
    updateLocationDashboardFieldsMock.mockResolvedValue({ status: "updated" });
    getLocationDashboardDetailMock.mockResolvedValue({
      assignedStaff: [],
      location: {
        address: "No 1, Kandy Road",
        createdAt: "2026-05-01T00:00:00.000Z",
        id: "location_1",
        isActive: true,
        isDefault: true,
        name: "Main branch",
        phone: "+94770000000",
        slug: "main",
        sortOrder: 0,
        timezone: "Asia/Colombo",
      },
      recentBookings: [],
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/locations/location_1", {
      body: JSON.stringify({
        address: "No 1, Kandy Road",
        isActive: true,
        name: "Main branch",
        timezone: "Asia/Colombo",
      }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "location_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(updateLocationDashboardFieldsMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "location_1", expect.objectContaining({
      name: "Main branch",
      timezone: "Asia/Colombo",
    }));
    expect(body.location).toMatchObject({ id: "location_1", name: "Main branch" });
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("rejects invalid location updates", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/locations/location_1", {
      body: JSON.stringify({ name: 42 }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "location_1" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Please check the location details.");
    expect(updateLocationDashboardFieldsMock).not.toHaveBeenCalled();
  });

  it("returns slug conflicts from the shared update helper", async () => {
    updateLocationDashboardFieldsMock.mockResolvedValue({
      error: "That branch slug is already in use.",
      status: "conflict",
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/locations/location_1", {
      body: JSON.stringify({ name: "Main branch" }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "location_1" }) });
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("That branch slug is already in use.");
  });
});
