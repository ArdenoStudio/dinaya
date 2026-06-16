function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildBookingIcs({
  uid,
  title,
  description,
  location,
  startsAt,
  endsAt,
}: {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: Date;
  endsAt: Date;
}): string {
  const now = formatIcsUtc(new Date());
  const dtStart = formatIcsUtc(startsAt);
  const dtEnd = formatIcsUtc(endsAt);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dinaya//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(title)}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
  }
  if (location) {
    lines.push(`LOCATION:${escapeIcsText(location)}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

export function buildGoogleCalendarUrl({
  title,
  description,
  location,
  startsAt,
  endsAt,
}: {
  title: string;
  description?: string;
  location?: string;
  startsAt: Date;
  endsAt: Date;
}): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatIcsUtc(startsAt)}/${formatIcsUtc(endsAt)}`,
  });
  if (description) params.set("details", description);
  if (location) params.set("location", location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
