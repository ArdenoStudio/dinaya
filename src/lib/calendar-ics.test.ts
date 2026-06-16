import { describe, expect, it } from "vitest";
import { buildBookingIcs, buildGoogleCalendarUrl } from "./calendar-ics";

describe("calendar-ics", () => {
  const startsAt = new Date("2026-06-16T04:00:00.000Z");
  const endsAt = new Date("2026-06-16T04:30:00.000Z");

  it("builds a valid ICS document", () => {
    const ics = buildBookingIcs({
      uid: "booking@test",
      title: "Haircut · Salon",
      description: "With Sam",
      location: "Colombo",
      startsAt,
      endsAt,
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:Haircut · Salon");
    expect(ics).toContain("DTSTART:20260616T040000Z");
    expect(ics).toContain("DTEND:20260616T043000Z");
    expect(ics).toContain("LOCATION:Colombo");
  });

  it("builds a Google Calendar URL", () => {
    const url = buildGoogleCalendarUrl({
      title: "Haircut",
      description: "Booking",
      startsAt,
      endsAt,
    });

    expect(url).toContain("calendar.google.com");
    expect(url).toContain("dates=20260616T040000Z%2F20260616T043000Z");
  });
});
