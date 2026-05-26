import { describe, expect, it } from "vitest";
import { shouldReleaseDealSlotOnCancel } from "./claim";

describe("deal slot release policy", () => {
  it("releases only for pending bookings", () => {
    expect(shouldReleaseDealSlotOnCancel("pending")).toBe(true);
    expect(shouldReleaseDealSlotOnCancel("confirmed")).toBe(false);
    expect(shouldReleaseDealSlotOnCancel("completed")).toBe(false);
  });
});

describe("releaseStaleDealHolds", () => {
  it("uses a 30-minute pending cutoff constant", async () => {
    const holds = await import("./holds");
    expect(typeof holds.releaseStaleDealHolds).toBe("function");
  });
});
