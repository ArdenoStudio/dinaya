import { describe, expect, it } from "vitest";
import { shouldReleaseDealSlotOnCancel } from "./claim";

describe("deal slot release policy", () => {
  it("releases only when the prior booking status was pending", () => {
    expect(shouldReleaseDealSlotOnCancel("pending")).toBe(true);
    expect(shouldReleaseDealSlotOnCancel("confirmed")).toBe(false);
    expect(shouldReleaseDealSlotOnCancel("completed")).toBe(false);
    expect(shouldReleaseDealSlotOnCancel("no_show")).toBe(false);
    expect(shouldReleaseDealSlotOnCancel("cancelled")).toBe(false);
  });
});
