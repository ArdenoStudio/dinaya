import { describe, expect, it } from "vitest";
import { createBookingCompletedEmbedEvent } from "./embed-events";

describe("booking embed events", () => {
  it("does not expose the booking capability identifier to the parent page", () => {
    const event = createBookingCompletedEmbedEvent("test-salon", "confirmed");

    expect(event).toEqual({
      type: "dinaya:booking_completed",
      slug: "test-salon",
      status: "confirmed",
    });
    expect(event).not.toHaveProperty("bookingId");
  });
});
