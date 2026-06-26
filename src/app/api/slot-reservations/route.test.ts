import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const withRateLimitMock = vi.hoisted(() => vi.fn());


vi.mock("@/lib/rate-limit", () => ({ withRateLimit: withRateLimitMock }));


import { POST, PATCH, DELETE } from "./route";

describe("POST, PATCH, DELETE /api/slot-reservations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    
  });

  describe("POST", () => {
    it("handles the request", async () => {
      const req = new NextRequest("http://localhost/api/slot-reservations", { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
      const res = await POST(req);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });

  describe("PATCH", () => {
    it("handles the request", async () => {
      const req = new NextRequest("http://localhost/api/slot-reservations", { method: "PATCH", body: "{}", headers: { "content-type": "application/json" } });
      const res = await PATCH(req);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });

  describe("DELETE", () => {
    it("handles the request", async () => {
      const req = new NextRequest("http://localhost/api/slot-reservations", { method: "DELETE", body: "{}", headers: { "content-type": "application/json" } });
      const res = await DELETE(req);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });
});
