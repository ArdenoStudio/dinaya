import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.hoisted(() => vi.fn());
const getBusinessHolidayForDateMock = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({
  db: { select: selectMock },
}));

vi.mock("@/lib/business-holidays", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/business-holidays")>();
  return {
    ...actual,
    getBusinessHolidayForDate: getBusinessHolidayForDateMock,
  };
});

import { isRequestedSlotAvailable } from "@/lib/booking-availability";

function makeSelectChain(rows: unknown[]) {
  const chain = {
    from: vi.fn(() => chain),
    where: vi.fn(async () => rows),
  };
  return chain;
}

describe("isRequestedSlotAvailable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectMock.mockImplementation(() => makeSelectChain([]));
  });

  it("returns false on a fully closed business holiday", async () => {
    getBusinessHolidayForDateMock.mockResolvedValue({
      id: "h1",
      businessId: "b1",
      locationId: null,
      date: "2026-06-16",
      label: "Poya Day",
      isClosed: true,
      startTime: null,
      endTime: null,
      createdAt: new Date(),
    });

    const available = await isRequestedSlotAvailable({
      staffId: "staff-1",
      businessId: "b1",
      start: new Date("2026-06-16T03:30:00.000Z"),
      durationMinutes: 30,
      timezone: "Asia/Colombo",
    });

    expect(available).toBe(false);
    expect(getBusinessHolidayForDateMock).toHaveBeenCalledWith({
      businessId: "b1",
      date: "2026-06-16",
      locationId: undefined,
    });
  });
});
