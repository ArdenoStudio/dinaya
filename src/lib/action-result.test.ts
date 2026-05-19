import { describe, expect, it } from "vitest";
import { fail, ok, validationError } from "./action-result";
import { z } from "zod";

describe("action-result helpers", () => {
  it("wraps successful action data in the standard ok shape", () => {
    expect(ok({ id: "booking_1" })).toEqual({
      ok: true,
      data: { id: "booking_1" },
    });
  });

  it("wraps failed actions in the standard error shape", () => {
    expect(fail("Name is required.")).toEqual({
      ok: false,
      error: "Name is required.",
    });
  });

  it("converts zod issues into fieldErrors", () => {
    const schema = z.object({
      name: z.string().min(1, "Name is required."),
      priceLkr: z.number().int().nonnegative("Price must be positive."),
    });

    const parsed = schema.safeParse({ name: "", priceLkr: -1 });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(validationError(parsed.error)).toEqual({
        ok: false,
        error: "Please check the highlighted fields.",
        fieldErrors: {
          name: ["Name is required."],
          priceLkr: ["Price must be positive."],
        },
      });
    }
  });
});
