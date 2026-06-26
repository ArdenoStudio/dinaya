import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireApiKeyMock = vi.hoisted(() => vi.fn());
const hasApiKeyAuthMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-key-auth", () => ({
  requireApiKey: requireApiKeyMock,
  hasApiKeyAuth: hasApiKeyAuthMock,
}));

import { GET } from "./route";

describe("GET /api/v1/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasApiKeyAuthMock.mockReturnValue(true);
    requireApiKeyMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", scopes: ["bookings:read", "bookings:write", "voice:read"] },
    });
  });

  describe("GET", () => {
    it("returns 401 when API key auth fails", async () => {
      requireApiKeyMock.mockResolvedValue({
        ok: false,
        response: Response.json({ error: "Unauthorized" }, { status: 401 }),
      });
      const req = new NextRequest("http://localhost/api/v1/availability");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("returns a response when authorized", async () => {
      const req = new NextRequest("http://localhost/api/v1/availability");
      const res = await GET(req);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });
});
