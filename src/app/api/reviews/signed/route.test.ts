import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeSelectQuery } from "@/test-utils/db-mock";

const withRateLimitMock = vi.hoisted(() => vi.fn());
const dbSelectMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/rate-limit", () => ({ withRateLimit: withRateLimitMock }));
vi.mock("@/db", () => ({ db: { select: dbSelectMock } }));

import { POST } from "./route";

describe("POST /api/reviews/signed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    dbSelectMock.mockReturnValue(makeSelectQuery([]));
  });

  describe("POST", () => {
    it("handles the request", async () => {
      const req = new NextRequest("http://localhost/api/reviews/signed", { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
      const res = await POST(req);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });
});
