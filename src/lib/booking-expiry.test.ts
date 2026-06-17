import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({
  db: {
    select: selectMock,
    update: updateMock,
  },
}));

vi.mock("@/lib/activity-log", () => ({ logActivity: vi.fn() }));
vi.mock("@/lib/deals/claim", () => ({ releaseDealSlotForBooking: vi.fn() }));
vi.mock("@/lib/webhooks", () => ({ dispatchWebhooks: vi.fn() }));

import { expireAbandonedPayhereBookings } from "@/lib/booking-expiry";

describe("expireAbandonedPayhereBookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zero when there are no stale bookings", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const where = vi.fn(() => ({ limit }));
    const innerJoinServices = vi.fn(() => ({ where }));
    const innerJoinPayments = vi.fn(() => ({ innerJoin: innerJoinServices }));
    const from = vi.fn(() => ({ innerJoin: innerJoinPayments }));
    selectMock.mockReturnValue({ from });

    const result = await expireAbandonedPayhereBookings();

    expect(result).toEqual({ expired: 0, checked: 0 });
    expect(updateMock).not.toHaveBeenCalled();
  });
});
