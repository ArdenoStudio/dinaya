import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const withRateLimitMock = vi.hoisted(() => vi.fn());


vi.mock("@/lib/rate-limit", () => ({ withRateLimit: withRateLimitMock }));


import { GET } from "./route";

describe("GET /api/client/bookings/[token]/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    
  });

  describe("GET", () => {
    it("handles the request", async () => {
      const req = new NextRequest("http://localhost/api/client/bookings/[token]/availability");
      const res = await GET(req, { params: Promise.resolve({"token":"test-token"}) });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });
});
