import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());


vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));
vi.mock("@/lib/rate-limit", () => ({ withRateLimit: withRateLimitMock }));


import { GET } from "./route";

const desktopAuthOk = { ok: true, context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1", keyId: "key_1", keyType: "desktop" } };
const desktopAuthFail = { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };

describe("GET /api/v1/desktop/[module]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireDesktopReadMock.mockResolvedValue(desktopAuthOk);
    withRateLimitMock.mockResolvedValue({ ok: true });
    
  });

  describe("GET", () => {
    it("returns 401 when desktop auth fails", async () => {
      requireDesktopReadMock.mockResolvedValue(desktopAuthFail);
      const req = new NextRequest("http://localhost/api/v1/desktop/[module]");
      const res = await GET(req, { params: Promise.resolve({"module":"test-module"}) });
      expect(res.status).toBe(401);
    });

    it("returns a response when authorized", async () => {
      const req = new NextRequest("http://localhost/api/v1/desktop/[module]");
      const res = await GET(req, { params: Promise.resolve({"module":"test-module"}) });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });
});
