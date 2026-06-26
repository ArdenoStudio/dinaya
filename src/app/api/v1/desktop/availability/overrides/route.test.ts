import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopWriteMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getAvailabilityDashboardOverviewMock = vi.hoisted(() => vi.fn());
const upsertAvailabilityDashboardOverrideMock = vi.hoisted(() => vi.fn());
const deleteAvailabilityDashboardOverrideMock = vi.hoisted(() => vi.fn());

function validUpsert(value: unknown) {
  if (!value || typeof value !== "object") return { success: false };
  const input = value as { date?: unknown; isBlocked?: unknown; staffId?: unknown };
  if (typeof input.staffId !== "string" || typeof input.date !== "string") return { success: false };
  return { success: true, data: value };
}

function validDelete(value: unknown) {
  if (!value || typeof value !== "object") return { success: false };
  const input = value as { id?: unknown; staffId?: unknown };
  if (typeof input.id !== "string" || typeof input.staffId !== "string") return { success: false };
  return { success: true, data: value };
}

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopWrite: requireDesktopWriteMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/availability", () => ({
  availabilityOverrideDeleteSchema: { safeParse: validDelete },
  availabilityOverrideUpsertSchema: { safeParse: validUpsert },
  deleteAvailabilityDashboardOverride: deleteAvailabilityDashboardOverrideMock,
  getAvailabilityDashboardOverview: getAvailabilityDashboardOverviewMock,
  upsertAvailabilityDashboardOverride: upsertAvailabilityDashboardOverrideMock,
}));

import { DELETE, POST } from "./route";

describe("/api/v1/desktop/availability/overrides", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopWriteMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1" },
    });
    getAvailabilityDashboardOverviewMock.mockResolvedValue({
      members: [
        {
          assignedLocations: [],
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
            bio: null,
            createdAt: "2026-05-01T00:00:00.000Z",
            id: "staff_1",
            isActive: true,
            name: "Ashan",
          },
          windows: [],
        },
      ],
    });
  });

  it("creates a blocked day override through the desktop write bridge", async () => {
    upsertAvailabilityDashboardOverrideMock.mockResolvedValue({
      override: { id: "override_1" },
      status: "updated",
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/availability/overrides", {
      body: JSON.stringify({
        date: "2026-06-01",
        isBlocked: true,
        reason: "Holiday",
        staffId: "staff_1",
      }),
      method: "POST",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(upsertAvailabilityDashboardOverrideMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", expect.objectContaining({
      date: "2026-06-01",
      isBlocked: true,
      staffId: "staff_1",
    }));
    expect(body.members[0].overrides).toHaveLength(1);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("returns validation errors for invalid custom override hours", async () => {
    upsertAvailabilityDashboardOverrideMock.mockResolvedValue({
      error: "Override hours require a valid start and end time.",
      status: "invalid",
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/availability/overrides", {
      body: JSON.stringify({
        date: "2026-06-01",
        endTime: "12:00",
        isBlocked: false,
        staffId: "staff_1",
        startTime: "13:00",
      }),
      method: "POST",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Override hours require a valid start and end time.");
  });

  it("deletes an override through the desktop write bridge", async () => {
    deleteAvailabilityDashboardOverrideMock.mockResolvedValue({ status: "deleted" });

    const req = new NextRequest("http://localhost/api/v1/desktop/availability/overrides?id=override_1&staffId=staff_1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(deleteAvailabilityDashboardOverrideMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", {
      id: "override_1",
      staffId: "staff_1",
    });
    expect(body.webUrl).toBe("/dashboard/availability");
  });

  it("rejects malformed override deletes", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/availability/overrides?id=override_1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid availability override.");
    expect(deleteAvailabilityDashboardOverrideMock).not.toHaveBeenCalled();
  });
});
