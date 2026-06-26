import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireApiKeyMock = vi.hoisted(() => vi.fn());
const getCalendarMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-key-auth", () => ({
  requireApiKey: requireApiKeyMock,
}));

vi.mock("@/app/api/calendar/route", () => ({
  GET: getCalendarMock,
}));

import { GET } from "./route";

describe("GET /api/v1/calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiKeyMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", scopes: ["bookings:read", "bookings:write", "voice:read"] },
    });
    getCalendarMock.mockResolvedValue(Response.json({ staff: [], bookings: [] }));
  });

  it("returns the API key auth response when authorization fails", async () => {
    requireApiKeyMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/calendar");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(getCalendarMock).not.toHaveBeenCalled();
  });

  it("delegates to the shared calendar route when authorized", async () => {
    const req = new NextRequest("http://localhost/api/v1/calendar?from=2026-06-01&to=2026-06-02");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(requireApiKeyMock).toHaveBeenCalledWith(req, "bookings:read");
    expect(getCalendarMock).toHaveBeenCalledWith(req);
  });
});
