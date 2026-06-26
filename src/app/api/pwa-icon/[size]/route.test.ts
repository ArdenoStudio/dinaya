import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";







import { GET } from "./route";

describe("GET /api/pwa-icon/[size]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    
  });

  describe("GET", () => {
    it("handles the request", async () => {
      const req = new NextRequest("http://localhost/api/pwa-icon/[size]");
      const res = await GET(req, { params: Promise.resolve({"size":"192"}) });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });
});
