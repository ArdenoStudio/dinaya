import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireApiBusinessMock = vi.hoisted(() => vi.fn());
const getReviewsDashboardListMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-auth", () => ({
  requireApiBusiness: requireApiBusinessMock,
}));

vi.mock("@/lib/dashboard/reviews", () => ({
  getReviewsDashboardList: getReviewsDashboardListMock,
}));

vi.mock("@/lib/plan", () => {
  class PlanRequiredError extends Error {
    constructor() {
      super("Reviews requires the Pro plan.");
      this.name = "PlanRequiredError";
    }
  }

  return {
    PlanRequiredError,
    requirePro: requireProMock,
  };
});

import { GET } from "./route";

describe("GET /api/dashboard/reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiBusinessMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1" },
    });
    requireProMock.mockResolvedValue(undefined);
    getReviewsDashboardListMock.mockResolvedValue({
      rows: [{ id: "review_1", authorName: "Kasun", rating: 5 }],
    });
  });

  it("returns auth failures immediately", async () => {
    requireApiBusinessMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/dashboard/reviews");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(requireProMock).not.toHaveBeenCalled();
    expect(getReviewsDashboardListMock).not.toHaveBeenCalled();
  });

  it("returns 402 when the reviews feature is not available", async () => {
    const { PlanRequiredError } = await import("@/lib/plan");
    requireProMock.mockRejectedValue(new PlanRequiredError("biz_1", "reviews", "pro"));

    const req = new NextRequest("http://localhost/api/dashboard/reviews");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(402);
    expect(body.error).toBe("Reviews requires the Pro plan.");
    expect(body.feature).toBe("reviews");
    expect(getReviewsDashboardListMock).not.toHaveBeenCalled();
  });

  it("returns reviews for entitled businesses", async () => {
    const req = new NextRequest("http://localhost/api/dashboard/reviews");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(requireProMock).toHaveBeenCalledWith("biz_1", "reviews");
    expect(getReviewsDashboardListMock).toHaveBeenCalledWith("biz_1", { limit: 200 });
    expect(body).toEqual([{ id: "review_1", authorName: "Kasun", rating: 5 }]);
  });
});
