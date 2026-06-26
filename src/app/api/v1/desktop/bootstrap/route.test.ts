import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeSelectQuery } from "@/test-utils/db-mock";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const dbSelectMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));
vi.mock("@/lib/rate-limit", () => ({ withRateLimit: withRateLimitMock }));
vi.mock("@/db", () => ({ db: { select: dbSelectMock } }));

import { GET } from "./route";

const desktopAuthOk = { ok: true, context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1", keyId: "key_1", keyType: "desktop" } };
const desktopAuthFail = { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };

describe("GET /api/v1/desktop/bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireDesktopReadMock.mockResolvedValue(desktopAuthOk);
    withRateLimitMock.mockResolvedValue({ ok: true });
    dbSelectMock.mockReturnValue(makeSelectQuery([{ id: "00000000-0000-4000-8000-000000000001", name: "Test Biz", slug: "test", timezone: "Asia/Colombo", plan: "pro" }]));
  });

  describe("GET", () => {
    it("returns 401 when desktop auth fails", async () => {
      requireDesktopReadMock.mockResolvedValue(desktopAuthFail);
      const req = new NextRequest("http://localhost/api/v1/desktop/bootstrap");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("returns a response when authorized", async () => {
      const req = new NextRequest("http://localhost/api/v1/desktop/bootstrap");
      const res = await GET(req);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });
});
