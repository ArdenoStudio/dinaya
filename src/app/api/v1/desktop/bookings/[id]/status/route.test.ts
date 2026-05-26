import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopBookingsMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const dbSelectMock = vi.hoisted(() => vi.fn());
const dbUpdateMock = vi.hoisted(() => vi.fn());
const logActivityMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopBookings: requireDesktopBookingsMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/activity-log", () => ({
  logActivity: logActivityMock,
}));

vi.mock("@/db", () => ({
  db: {
    select: dbSelectMock,
    update: dbUpdateMock,
  },
}));

import { PATCH } from "./route";

function makeSelectQuery(result: unknown) {
  const query = {
    from: vi.fn(() => query),
    where: vi.fn(() => query),
    limit: vi.fn(async () => result),
  };
  return query;
}

function makeUpdateQuery(result: unknown) {
  const query = {
    set: vi.fn(() => query),
    where: vi.fn(() => query),
    returning: vi.fn(async () => result),
  };
  return query;
}

describe("PATCH /api/v1/desktop/bookings/:id/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    logActivityMock.mockResolvedValue(undefined);
  });

  it("blocks forbidden status transitions", async () => {
    requireDesktopBookingsMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1", keyId: "key_1" },
    });
    dbSelectMock.mockReturnValueOnce(makeSelectQuery([{ id: "bk_1", status: "completed" }]));

    const req = new NextRequest("http://localhost/api/v1/desktop/bookings/bk_1/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "confirmed" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "bk_1" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("Cannot change");
  });

  it("updates status for valid transitions", async () => {
    requireDesktopBookingsMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1", keyId: "key_1" },
    });

    dbSelectMock
      .mockReturnValueOnce(makeSelectQuery([{ id: "bk_1", status: "pending" }]))
      .mockReturnValueOnce(makeSelectQuery([]));
    dbUpdateMock.mockReturnValueOnce(makeUpdateQuery([
      {
        id: "bk_1",
        status: "confirmed",
        startsAt: new Date("2026-05-26T09:00:00.000Z"),
        endsAt: new Date("2026-05-26T09:45:00.000Z"),
        createdAt: new Date("2026-05-26T08:00:00.000Z"),
      },
    ]));

    const req = new NextRequest("http://localhost/api/v1/desktop/bookings/bk_1/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "confirmed" }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "bk_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("confirmed");
    expect(logActivityMock).toHaveBeenCalledTimes(1);
  });
});
