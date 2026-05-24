import { describe, expect, it } from "vitest";
import {
  BROADCAST_AUDIENCE_TYPES,
  BROADCAST_CHANNELS,
  MAX_BROADCAST_RECIPIENTS,
} from "./broadcasts";

describe("broadcasts", () => {
  it("defines supported audience types and channels", () => {
    expect(BROADCAST_AUDIENCE_TYPES).toEqual(["all", "stage", "tags"]);
    expect(BROADCAST_CHANNELS).toEqual(["email", "whatsapp", "sms"]);
  });

  it("caps recipient batches for MVP sends", () => {
    expect(MAX_BROADCAST_RECIPIENTS).toBe(200);
  });
});
