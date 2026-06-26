import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const requireDesktopWriteMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getAvailabilityDashboardOverviewMock = vi.hoisted(() => vi.fn());
const updateAvailabilityDashboardWindowsMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
  requireDesktopWrite: requireDesktopWriteMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/availability", () => ({
  availabilityWindowsUpdateSchema: {
    safeParse: (value: unknown) => {
      if (!value || typeof value !== "object") return { success: false };
      const input = value as { rows?: unknown; staffId?: unknown };
      if (typeof input.staffId !== "string") return { success: false };
      if (!Array.isArray(input.rows)) return { success: false };
      for (const row of input.rows) {
        if (!row || typeof row !== "object") return { success: false };
        const item = row as { dayOfWeek?: unknown; endTime?: unknown; startTime?: unknown };
        if (typeof item.dayOfWeek !== "number" || item.dayOfWeek < 0 || item.dayOfWeek > 6) return { success: false };
        if (typeof item.startTime !== "string" || typeof item.endTime !== "string") return { success: false };
      }
      return { success: true, data: input };
    },
  },
  getAvailabilityDashboardOverview: getAvailabilityDashboardOverviewMock,
  updateAvailabilityDashboardWindows: updateAvailabilityDashboardWindowsMock,
}));

import { GET, PATCH } from "./route";

describe("GET /api/v1/desktop/availability", () => {
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

    const req = new NextRequest("http://localhost/api/v1/desktop/availability");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(getAvailabilityDashboardOverviewMock).not.toHaveBeenCalled();
  });

  it("returns grouped staff availability and overrides", async () => {
    getAvailabilityDashboardOverviewMock.mockResolvedValue({
      members: [
        {
          assignedLocations: [
            { id: "location_1", isActive: true, isPrimary: true, name: "Kandy", timezone: "Asia/Colombo" },
          ],
          overrides: [
            {
              date: "2026-06-01",
              endTime: null,
              id: "override_1",
              isBlocked: true,
              reason: "Holiday",
              startTime: null,
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
          windows: [
            { dayOfWeek: 1, endTime: "17:00", id: "window_1", startTime: "09:00" },
          ],
        },
      ],
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/availability");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/availability");
    expect(body.members).toHaveLength(1);
    expect(body.members[0].windows).toHaveLength(1);
    expect(body.members[0].overrides).toHaveLength(1);
    expect(body.serverTime).toEqual(expect.any(String));
    expect(getAvailabilityDashboardOverviewMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
  });

  it("updates weekly windows through the desktop write bridge", async () => {
    updateAvailabilityDashboardWindowsMock.mockResolvedValue({ status: "updated" });
    getAvailabilityDashboardOverviewMock.mockResolvedValue({
      members: [
        {
          assignedLocations: [],
          overrides: [],
          staff: {
            avatarUrl: null,
            bio: null,
            createdAt: "2026-05-01T00:00:00.000Z",
            id: "staff_1",
            isActive: true,
            name: "Ashan",
          },
          windows: [
            { dayOfWeek: 1, endTime: "17:00", id: "window_1", startTime: "09:00" },
            { dayOfWeek: 2, endTime: "15:00", id: "window_2", startTime: "10:00" },
          ],
        },
      ],
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/availability", {
      body: JSON.stringify({
        staffId: "staff_1",
        rows: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
          { dayOfWeek: 2, startTime: "10:00", endTime: "15:00" },
        ],
      }),
      method: "PATCH",
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(updateAvailabilityDashboardWindowsMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "staff_1", [
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 2, startTime: "10:00", endTime: "15:00" },
    ]);
    expect(body.members[0].windows).toHaveLength(2);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("returns validation errors for overlapping or invalid availability windows", async () => {
    updateAvailabilityDashboardWindowsMock.mockResolvedValue({
      status: "invalid",
      error: "Availability blocks cannot overlap.",
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/availability", {
      body: JSON.stringify({
        staffId: "staff_1",
        rows: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
          { dayOfWeek: 1, startTime: "11:00", endTime: "15:00" },
        ],
      }),
      method: "PATCH",
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Availability blocks cannot overlap.");
  });

  it("rejects malformed availability updates", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/availability", {
      body: JSON.stringify({ staffId: "staff_1", rows: [{ dayOfWeek: 9 }] }),
      method: "PATCH",
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid availability payload.");
    expect(updateAvailabilityDashboardWindowsMock).not.toHaveBeenCalled();
  });
});
