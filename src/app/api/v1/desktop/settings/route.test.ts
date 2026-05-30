import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const requireDesktopWriteMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getDesktopSettingsDataMock = vi.hoisted(() => vi.fn());
const revokeCurrentDesktopDeviceMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
  requireDesktopWrite: requireDesktopWriteMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/settings", () => ({
  getDesktopSettingsData: getDesktopSettingsDataMock,
  revokeCurrentDesktopDevice: revokeCurrentDesktopDeviceMock,
}));

import { GET, PATCH } from "./route";

describe("/api/v1/desktop/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1", keyId: "key_1" },
    });
    requireDesktopWriteMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1", keyId: "key_1" },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/settings");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(getDesktopSettingsDataMock).not.toHaveBeenCalled();
  });

  it("returns business and desktop device settings", async () => {
    getDesktopSettingsDataMock.mockResolvedValue({
      business: {
        address: "Kandy",
        customDomain: null,
        directoryListed: true,
        email: "owner@example.com",
        id: "biz_1",
        name: "Salon",
        payhereEnabled: true,
        phone: "0770000000",
        plan: "pro",
        slug: "salon",
        timezone: "Asia/Colombo",
      },
      currentKeyId: "key_1",
      devices: [
        {
          createdAt: "2026-05-28T09:00:00.000Z",
          deviceId: "device_1",
          deviceName: "Windows PC",
          expiresAt: null,
          id: "key_1",
          isCurrent: true,
          lastUsedAt: "2026-05-28T09:05:00.000Z",
          name: "Desktop - Windows PC",
          revokedAt: null,
          scopes: ["desktop:read", "desktop:bookings", "desktop:write"],
        },
      ],
      summary: { activeDevices: 1, currentDeviceRevoked: false, revokedDevices: 0, totalDevices: 1 },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/settings");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/settings");
    expect(body.business).toMatchObject({ id: "biz_1", name: "Salon" });
    expect(body.devices[0]).toMatchObject({ id: "key_1", isCurrent: true });
    expect(getDesktopSettingsDataMock).toHaveBeenCalledWith("biz_1", "key_1");
  });

  it("revokes the current desktop device", async () => {
    revokeCurrentDesktopDeviceMock.mockResolvedValue({ id: "key_1" });

    const req = new NextRequest("http://localhost/api/v1/desktop/settings", {
      body: JSON.stringify({ revokeCurrentDevice: true }),
      method: "PATCH",
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.revoked).toBe(true);
    expect(body.revokedKeyId).toBe("key_1");
    expect(revokeCurrentDesktopDeviceMock).toHaveBeenCalledWith("biz_1", "key_1");
  });

  it("rejects invalid settings updates", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/settings", {
      body: JSON.stringify({ revokeCurrentDevice: false }),
      method: "PATCH",
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid settings update.");
    expect(revokeCurrentDesktopDeviceMock).not.toHaveBeenCalled();
  });
});
