import { describe, expect, it } from "vitest";
import { isoDateString, nullableIsoDateString } from "@/lib/dashboard/serialization";

describe("dashboard serialization dates", () => {
  it("serializes Date and string values", () => {
    expect(isoDateString(new Date("2026-06-07T10:00:00.000Z"))).toBe("2026-06-07T10:00:00.000Z");
    expect(isoDateString("2026-06-07T10:00:00.000Z")).toBe("2026-06-07T10:00:00.000Z");
  });

  it("keeps required date fields string-shaped for legacy missing values", () => {
    expect(isoDateString(null)).toBe("1970-01-01T00:00:00.000Z");
    expect(isoDateString("not-a-date")).toBe("1970-01-01T00:00:00.000Z");
  });

  it("returns null for optional missing dates", () => {
    expect(nullableIsoDateString(null)).toBeNull();
    expect(nullableIsoDateString("not-a-date")).toBeNull();
  });
});
