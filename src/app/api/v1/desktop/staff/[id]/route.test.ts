import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const requireDesktopWriteMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getStaffDashboardDetailMock = vi.hoisted(() => vi.fn());
const updateStaffDashboardFieldsMock = vi.hoisted(() => vi.fn());

function validStaffPatch(value: unknown) {
  if (!value || typeof value !== "object") return { success: false };
  const input = value as { isActive?: unknown; name?: unknown };
  if (input.name !== undefined && typeof input.name !== "string") return { success: false };
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

vi.mock("@/lib/dashboard/staff", () => ({
  getStaffDashboardDetail: getStaffDashboardDetailMock,
  staffDashboardUpdateSchema: { safeParse: validStaffPatch },
  updateStaffDashboardFields: updateStaffDashboardFieldsMock,
}));

import { GET, PATCH } from "./route";

describe("GET /api/v1/desktop/staff/:id", () => {
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

    const req = new NextRequest("http://localhost/api/v1/desktop/staff/staff_1");
    const res = await GET(req, { params: Promise.resolve({ id: "staff_1" }) });

    expect(res.status).toBe(401);
    expect(getStaffDashboardDetailMock).not.toHaveBeenCalled();
  });

  it("returns 404 for staff outside the tenant", async () => {
    getStaffDashboardDetailMock.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/desktop/staff/staff_1");
    const res = await GET(req, { params: Promise.resolve({ id: "staff_1" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found.");
    expect(getStaffDashboardDetailMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "staff_1");
  });

  it("returns staff profile, assignments, availability, and recent bookings", async () => {
    getStaffDashboardDetailMock.mockResolvedValue({
      assignedLocations: [
        { id: "location_1", isActive: true, isPrimary: true, name: "Kandy", timezone: "Asia/Colombo" },
      ],
      assignedServices: [
        {
          durationMinutes: 45,
          id: "service_1",
          isActive: true,
          name: "Haircut",
          priceLkr: 2500,
          priceOverrideLkr: null,
        },
      ],
      availableLocations: [
        { id: "location_1", isActive: true, name: "Kandy", timezone: "Asia/Colombo" },
      ],
      availableServices: [
        {
          durationMinutes: 45,
          id: "service_1",
          isActive: true,
          name: "Haircut",
          priceLkr: 2500,
        },
      ],
      availability: [
        { dayOfWeek: 1, endTime: "17:00", id: "availability_1", startTime: "09:00" },
      ],
      recentBookings: [
        {
          clientName: "Kasun",
          id: "booking_1",
          serviceName: "Haircut",
          startsAt: "2026-05-28T09:00:00.000Z",
          status: "confirmed",
        },
      ],
      staff: {
        avatarUrl: null,
        bio: "Senior barber",
        createdAt: "2026-05-01T00:00:00.000Z",
        id: "staff_1",
        isActive: true,
        name: "Ashan",
      },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/staff/staff_1");
    const res = await GET(req, { params: Promise.resolve({ id: "staff_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/staff/staff_1");
    expect(body.staff).toMatchObject({ id: "staff_1", name: "Ashan" });
    expect(body.assignedLocations).toHaveLength(1);
    expect(body.assignedServices).toHaveLength(1);
    expect(body.availability).toHaveLength(1);
    expect(body.recentBookings).toHaveLength(1);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("updates staff basics and returns refreshed detail", async () => {
    updateStaffDashboardFieldsMock.mockResolvedValue({ status: "updated" });
    getStaffDashboardDetailMock.mockResolvedValue({
      assignedLocations: [
        { id: "location_1", isActive: true, isPrimary: true, name: "Kandy", timezone: "Asia/Colombo" },
      ],
      assignedServices: [],
      availableLocations: [
        { id: "location_1", isActive: true, name: "Kandy", timezone: "Asia/Colombo" },
      ],
      availableServices: [],
      availability: [],
      recentBookings: [],
      staff: {
        avatarUrl: null,
        bio: "Lead stylist",
        createdAt: "2026-05-01T00:00:00.000Z",
        id: "staff_1",
        isActive: false,
        name: "Ashan",
      },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/staff/staff_1", {
      body: JSON.stringify({
        isActive: false,
        name: "Ashan",
      }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "staff_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(updateStaffDashboardFieldsMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "staff_1", {
      isActive: false,
      name: "Ashan",
    });
    expect(body.staff).toMatchObject({ id: "staff_1", isActive: false, name: "Ashan" });
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("rejects invalid staff updates", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/staff/staff_1", {
      body: JSON.stringify({ name: 42 }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "staff_1" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Please check the staff details.");
    expect(updateStaffDashboardFieldsMock).not.toHaveBeenCalled();
  });

  it("returns invalid assignment errors from the shared update helper", async () => {
    updateStaffDashboardFieldsMock.mockResolvedValue({
      error: "One or more locations are invalid or inactive.",
      status: "invalid",
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/staff/staff_1", {
      body: JSON.stringify({ isActive: true }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "staff_1" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("One or more locations are invalid or inactive.");
  });
});
