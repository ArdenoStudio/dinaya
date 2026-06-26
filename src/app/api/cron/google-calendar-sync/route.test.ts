import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const syncGoogleCalendarBookingsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/google-calendar-sync", () => ({
  syncGoogleCalendarBookings: syncGoogleCalendarBookingsMock,
}));

import { GET } from "./route";

describe("GET /api/cron/google-calendar-sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-test-secret";
    syncGoogleCalendarBookingsMock.mockResolvedValue({ ok: true });
  });

  it("returns 401 without bearer token", async () => {
    const req = new NextRequest("http://localhost/api/cron/google-calendar-sync");
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(syncGoogleCalendarBookingsMock).not.toHaveBeenCalled();
  });

  it("runs when authorized", async () => {
    const req = new NextRequest("http://localhost/api/cron/google-calendar-sync", {
      headers: { authorization: "Bearer cron-test-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(syncGoogleCalendarBookingsMock).toHaveBeenCalled();
  });

  it("returns 500 when handler throws", async () => {
    syncGoogleCalendarBookingsMock.mockRejectedValue(new Error("cron failed"));
    const req = new NextRequest("http://localhost/api/cron/google-calendar-sync", {
      headers: { authorization: "Bearer cron-test-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
