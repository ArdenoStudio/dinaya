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
      context: { businessId: "00000000-0000-4000-8000-000000000001" },
    });
    requireProMock.mockResolvedValue(undefined);
    getReviewsDashboardListMock.mockResolvedValue({
      rows: [{ id: "review_1", authorName: "Kasun", rating: 5 }],
      hasMore: false,
      nextCursor: null,
      summary: { totalReviews: 1, averageRating: 5, publishedReviews: 1 },
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
    requireProMock.mockRejectedValue(new PlanRequiredError("00000000-0000-4000-8000-000000000001", "reviews", "pro"));

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
    expect(requireProMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "reviews");
    expect(getReviewsDashboardListMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", {
      limit: 80,
      cursor: null,
    });
    expect(body).toEqual({
      reviews: [{ id: "review_1", authorName: "Kasun", rating: 5 }],
      hasMore: false,
      nextCursor: null,
      summary: { totalReviews: 1, averageRating: 5, publishedReviews: 1 },
    });
  });

  it("rejects an invalid cursor", async () => {
    const req = new NextRequest("http://localhost/api/dashboard/reviews?cursor=not-a-date");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("passes a valid cursor through to the list function", async () => {
    const iso = "2026-01-01T00:00:00.000Z";
    const req = new NextRequest(`http://localhost/api/dashboard/reviews?cursor=${iso}`);
    await GET(req);
    expect(getReviewsDashboardListMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", {
      limit: 80,
      cursor: new Date(iso),
    });
  });
});
