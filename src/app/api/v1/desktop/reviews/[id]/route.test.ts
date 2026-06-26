import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const requireDesktopWriteMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getReviewDashboardDetailMock = vi.hoisted(() => vi.fn());
const updateReviewDashboardFieldsMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
  requireDesktopWrite: requireDesktopWriteMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/reviews", () => ({
  getReviewDashboardDetail: getReviewDashboardDetailMock,
  updateReviewDashboardFields: updateReviewDashboardFieldsMock,
}));

vi.mock("@/lib/plan", async () => {
  class PlanRequiredError extends Error {}
  return {
    PlanRequiredError,
    requirePro: requireProMock,
  };
});

import { GET, PATCH } from "./route";

const reviewDetail = {
  booking: {
    id: "booking_1",
    locationName: "Kandy",
    serviceName: "Haircut",
    staffName: "Ashan",
    startsAt: "2026-05-28T09:00:00.000Z",
    status: "completed",
  },
  review: {
    clientName: "Kasun",
    comment: "Great service",
    createdAt: "2026-05-28T10:00:00.000Z",
    id: "review_1",
    isPublished: true,
    ownerRepliedAt: null,
    ownerReply: null,
    ownerReplySource: null,
    rating: 5,
  },
};

describe("GET /api/v1/desktop/reviews/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1" },
    });
    requireDesktopWriteMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", deviceId: "device_1" },
    });
    requireProMock.mockResolvedValue(undefined);
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/reviews/review_1");
    const res = await GET(req, { params: Promise.resolve({ id: "review_1" }) });

    expect(res.status).toBe(401);
    expect(getReviewDashboardDetailMock).not.toHaveBeenCalled();
  });

  it("returns 404 for a review outside the tenant", async () => {
    getReviewDashboardDetailMock.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/desktop/reviews/review_1");
    const res = await GET(req, { params: Promise.resolve({ id: "review_1" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found.");
    expect(getReviewDashboardDetailMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "review_1");
  });

  it("returns review details with booking context", async () => {
    getReviewDashboardDetailMock.mockResolvedValue(reviewDetail);

    const req = new NextRequest("http://localhost/api/v1/desktop/reviews/review_1");
    const res = await GET(req, { params: Promise.resolve({ id: "review_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/reviews");
    expect(body.review).toMatchObject({ id: "review_1", rating: 5 });
    expect(body.booking).toMatchObject({ id: "booking_1", serviceName: "Haircut" });
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("updates an owner reply with desktop write scope", async () => {
    updateReviewDashboardFieldsMock.mockResolvedValue({ id: "review_1" });
    getReviewDashboardDetailMock.mockResolvedValue({
      ...reviewDetail,
      review: {
        ...reviewDetail.review,
        ownerReply: "Thank you for visiting!",
      },
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/reviews/review_1", {
      method: "PATCH",
      body: JSON.stringify({ ownerReply: "Thank you for visiting!" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "review_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(requireProMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "reviewReplies");
    expect(updateReviewDashboardFieldsMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "review_1", {
      ownerReply: "Thank you for visiting!",
    });
    expect(body.review.ownerReply).toBe("Thank you for visiting!");
  });
});
