import { describe, expect, it } from "vitest";
import { parseSubscribeRequest } from "./billing-subscribe";

describe("parseSubscribeRequest", () => {
  it("defaults to monthly pro", () => {
    expect(parseSubscribeRequest({})).toEqual({ targetPlan: "pro", interval: "monthly" });
  });

  it("accepts max and annual", () => {
    expect(parseSubscribeRequest({ plan: "max", interval: "annual" })).toEqual({
      targetPlan: "max",
      interval: "annual",
    });
  });

  it("falls back for unknown values", () => {
    expect(parseSubscribeRequest({ plan: "enterprise", interval: "weekly" })).toEqual({
      targetPlan: "pro",
      interval: "monthly",
    });
  });
});
