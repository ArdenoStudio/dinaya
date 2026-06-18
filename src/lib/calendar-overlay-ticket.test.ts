import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createCalendarOverlayTicket,
  verifyCalendarOverlayTicket,
} from "@/lib/calendar-overlay-ticket";

const previousSecret = process.env.SECRET_ENCRYPTION_KEY;

describe("calendar overlay connection tickets", () => {
  beforeEach(() => {
    process.env.SECRET_ENCRYPTION_KEY = "calendar-overlay-test-secret";
  });

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.SECRET_ENCRYPTION_KEY;
    } else {
      process.env.SECRET_ENCRYPTION_KEY = previousSecret;
    }
  });

  it("round-trips the exact booking origin and channel", () => {
    const created = createCalendarOverlayTicket("https://salon.example.com/path");
    const verified = verifyCalendarOverlayTicket(created.ticket);

    expect(verified).toMatchObject({
      origin: "https://salon.example.com",
      channel: created.channel,
      language: "en",
    });
  });

  it("stores the booking language on the ticket", () => {
    const created = createCalendarOverlayTicket("https://salon.example.com", "si");
    const verified = verifyCalendarOverlayTicket(created.ticket);

    expect(verified).toMatchObject({
      origin: "https://salon.example.com",
      language: "si",
    });
  });

  it("rejects tampered tickets", () => {
    const created = createCalendarOverlayTicket("https://dinaya.lk");
    expect(verifyCalendarOverlayTicket(`${created.ticket}tampered`)).toBeNull();
  });
});
