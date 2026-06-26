import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireApiKeyMock = vi.hoisted(() => vi.fn());
const hasApiKeyAuthMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const authMock = vi.hoisted(() => vi.fn());
const dbSelectMock = vi.hoisted(() => vi.fn());
const dbInsertMock = vi.hoisted(() => vi.fn());
const dbUpdateMock = vi.hoisted(() => vi.fn());
const dbDeleteMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/db", () => ({
  db: {
    select: dbSelectMock,
    insert: dbInsertMock,
    update: dbUpdateMock,
    delete: dbDeleteMock,
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/api-key-auth", () => ({
  requireApiKey: requireApiKeyMock,
  hasApiKeyAuth: hasApiKeyAuthMock,
}));

import { POST } from "./route";

describe("POST /api/bookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(null);
    withRateLimitMock.mockResolvedValue({ ok: true });
    hasApiKeyAuthMock.mockReturnValue(true);
    requireApiKeyMock.mockResolvedValue({
      ok: true,
      context: {
        businessId: "00000000-0000-4000-8000-000000000001",
        scopes: ["bookings:read", "bookings:write", "voice:read"],
      },
    });
  });

  it("returns the rate-limit response when throttled", async () => {
    withRateLimitMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Too many requests" }, { status: 429 }),
    });

    const req = new NextRequest("http://localhost/api/bookings", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(429);
    expect(requireApiKeyMock).not.toHaveBeenCalled();
  });

  it("returns 401 when API key auth fails", async () => {
    requireApiKeyMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify({ businessId: "00000000-0000-4000-8000-000000000001" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid booking payloads before hitting business logic", async () => {
    const req = new NextRequest("http://localhost/api/bookings", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Please check the booking details.");
    expect(authMock).not.toHaveBeenCalled();
  });
});
