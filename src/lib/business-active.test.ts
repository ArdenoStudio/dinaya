import { describe, expect, it } from "vitest";
import { businessInactiveMessage } from "./business-active";

describe("businessInactiveMessage", () => {
  it("returns suspended message", () => {
    expect(businessInactiveMessage("suspended")).toBe("This account has been suspended.");
  });

  it("returns deleted message", () => {
    expect(businessInactiveMessage("deleted")).toBe("This account is no longer active.");
  });

  it("returns not found message", () => {
    expect(businessInactiveMessage("not_found")).toBe("Business not found.");
  });
});
