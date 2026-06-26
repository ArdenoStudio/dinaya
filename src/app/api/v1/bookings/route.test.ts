import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireApiKeyMock = vi.hoisted(() => vi.fn());
const hasApiKeyAuthMock = vi.hoisted(() => vi.fn());
const createBookingMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-key-auth", () => ({
  requireApiKey: requireApiKeyMock,
  hasApiKeyAuth: hasApiKeyAuthMock,
}));

vi.mock("@/app/api/bookings/route", () => ({
  POST: createBookingMock,
}));

import { POST } from "./route";

describe("POST /api/v1/bookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasApiKeyAuthMock.mockReturnValue(true);
    requireApiKeyMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", scopes: ["bookings:read", "bookings:write", "voice:read"] },
    });
    createBookingMock.mockResolvedValue(Response.json({ bookingId: "booking_1" }, { status: 201 }));
  });

  it("returns 401 when no API key is present", async () => {
    hasApiKeyAuthMock.mockReturnValue(false);

    const req = new NextRequest("http://localhost/api/v1/bookings", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("API key required");
    expect(requireApiKeyMock).not.toHaveBeenCalled();
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it("returns the API key auth response when authorization fails", async () => {
    requireApiKeyMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/bookings", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(createBookingMock).not.toHaveBeenCalled();
  });

  it("delegates to the shared booking route when authorized", async () => {
    const req = new NextRequest("http://localhost/api/v1/bookings", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(requireApiKeyMock).toHaveBeenCalledWith(req, "bookings:write");
    expect(createBookingMock).toHaveBeenCalledWith(req);
  });
});
