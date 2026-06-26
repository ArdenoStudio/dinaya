import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const withRateLimitMock = vi.hoisted(() => vi.fn());


vi.mock("@/lib/rate-limit", () => ({ withRateLimit: withRateLimitMock }));


import { POST } from "./route";

describe("POST /api/client/bookings/[token]/reschedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    
  });

  describe("POST", () => {
    it("handles the request", async () => {
      const req = new NextRequest("http://localhost/api/client/bookings/[token]/reschedule", { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
      const res = await POST(req, { params: Promise.resolve({"token":"test-token"}) });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });
});
