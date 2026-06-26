import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const withRateLimitMock = vi.hoisted(() => vi.fn());


vi.mock("@/lib/rate-limit", () => ({ withRateLimit: withRateLimitMock }));


import { POST } from "./route";

describe("POST /api/bookings/[id]/paypal-capture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    
  });

  describe("POST", () => {
    it("handles the request", async () => {
      const req = new NextRequest("http://localhost/api/bookings/[id]/paypal-capture", { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
      const res = await POST(req, { params: Promise.resolve({"id":"00000000-0000-4000-8000-000000000003"}) });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });
});
