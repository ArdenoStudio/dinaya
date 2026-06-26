import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeSelectQuery } from "@/test-utils/db-mock";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const dbSelectMock = vi.hoisted(() => vi.fn());
const getDashboardOverviewDataMock = vi.hoisted(() => vi.fn());
const serializeDashboardOverviewDataMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));
vi.mock("@/lib/rate-limit", () => ({ withRateLimit: withRateLimitMock }));
vi.mock("@/db", () => ({ db: { select: dbSelectMock } }));
vi.mock("@/lib/dashboard/overview-data", () => ({
  getDashboardOverviewData: getDashboardOverviewDataMock,
  serializeDashboardOverviewData: serializeDashboardOverviewDataMock,
}));

import { GET } from "./route";

const desktopAuthOk = { ok: true, context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1", keyId: "key_1", keyType: "desktop" } };
const desktopAuthFail = { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };

describe("GET /api/v1/desktop/overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireDesktopReadMock.mockResolvedValue(desktopAuthOk);
    withRateLimitMock.mockResolvedValue({ ok: true });
    dbSelectMock
      .mockReturnValueOnce(makeSelectQuery([{
        language: "en",
        plan: "starter",
        planExpiresAt: null,
      }]))
      .mockReturnValueOnce(makeSelectQuery([{ servicesCount: 2 }]))
      .mockReturnValueOnce(makeSelectQuery([{ staffCount: 1 }]))
      .mockReturnValueOnce(makeSelectQuery([{ locationsCount: 1 }]));
    getDashboardOverviewDataMock.mockResolvedValue({ totals: { bookings: 12 } });
    serializeDashboardOverviewDataMock.mockReturnValue({ bookings: 12 });
  });

  it("returns 401 when desktop auth fails", async () => {
    requireDesktopReadMock.mockResolvedValue(desktopAuthFail);

    const req = new NextRequest("http://localhost/api/v1/desktop/overview");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("returns serialized overview data and shell usage", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/overview");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getDashboardOverviewDataMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
    expect(body.overview).toEqual({ bookings: 12 });
    expect(body.shell).toEqual({
      language: "en",
      planUsage: {
        services: { used: 2, limit: 10 },
        staff: { used: 1, limit: 2 },
        locations: { used: 1, limit: 1 },
      },
      trialDaysLeft: null,
    });
    expect(body.serverTime).toEqual(expect.any(String));
  });
});
