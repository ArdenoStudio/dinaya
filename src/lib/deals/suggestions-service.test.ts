import { describe, expect, it } from "vitest";
import { selectBestServiceForGap } from "./suggestions";

const services = [
  {
    id: "1",
    name: "Quick trim",
    durationMinutes: 30,
    priceLkr: 1000,
    beforeBuffer: 0,
    afterBuffer: 0,
    minimumNoticeHours: 0,
  },
  {
    id: "2",
    name: "Full colour",
    durationMinutes: 120,
    priceLkr: 8000,
    beforeBuffer: 0,
    afterBuffer: 0,
    minimumNoticeHours: 0,
  },
  {
    id: "3",
    name: "Haircut",
    durationMinutes: 45,
    priceLkr: 2500,
    beforeBuffer: 0,
    afterBuffer: 0,
    minimumNoticeHours: 0,
  },
];

describe("selectBestServiceForGap", () => {
  it("prefers highest-revenue service that fits the gap", () => {
    expect(selectBestServiceForGap(services, 60)?.id).toBe("3");
    expect(selectBestServiceForGap(services, 180)?.id).toBe("2");
  });

  it("falls back when no service fits duration", () => {
    const picked = selectBestServiceForGap(services, 20);
    expect(picked).not.toBeNull();
  });
});
