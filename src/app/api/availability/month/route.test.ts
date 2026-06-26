import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeSelectQuery } from "@/test-utils/db-mock";

const withRateLimitMock = vi.hoisted(() => vi.fn());
const dbSelectMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/rate-limit", () => ({ withRateLimit: withRateLimitMock }));
vi.mock("@/db", () => ({ db: { select: dbSelectMock } }));

import { GET } from "./route";

describe("GET /api/availability/month", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    dbSelectMock.mockReturnValue(makeSelectQuery([]));
  });

  describe("GET", () => {
    it("handles the request", async () => {
      const req = new NextRequest("http://localhost/api/availability/month");
      const res = await GET(req);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });
});
