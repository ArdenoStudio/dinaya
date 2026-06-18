import { addDays, format, parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

export const GOOGLE_CALENDAR_FREE_BUSY_SCOPE =
  "https://www.googleapis.com/auth/calendar.freebusy";

export type CalendarBusyTime = {
  start: string;
  end: string;
};

export function getCalendarDayBounds(date: string, timezone: string): {
  timeMin: string;
  timeMax: string;
} {
  const nextDate = format(addDays(parseISO(`${date}T12:00:00`), 1), "yyyy-MM-dd");
  return {
    timeMin: fromZonedTime(`${date}T00:00:00`, timezone).toISOString(),
    timeMax: fromZonedTime(`${nextDate}T00:00:00`, timezone).toISOString(),
  };
}

export function slotConflictsWithBusyTime(
  slot: { startUtc: string; endUtc: string },
  busyTimes: CalendarBusyTime[],
): boolean {
  const slotStart = Date.parse(slot.startUtc);
  const slotEnd = Date.parse(slot.endUtc);
  if (!Number.isFinite(slotStart) || !Number.isFinite(slotEnd)) return false;

  return busyTimes.some((busy) => {
    const busyStart = Date.parse(busy.start);
    const busyEnd = Date.parse(busy.end);
    return (
      Number.isFinite(busyStart) &&
      Number.isFinite(busyEnd) &&
      slotStart < busyEnd &&
      slotEnd > busyStart
    );
  });
}

export async function fetchGoogleCalendarBusyTimes(input: {
  accessToken: string;
  date: string;
  timezone: string;
  signal?: AbortSignal;
}): Promise<CalendarBusyTime[]> {
  const { timeMin, timeMax } = getCalendarDayBounds(input.date, input.timezone);
  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: input.timezone,
      items: [{ id: "primary" }],
    }),
    signal: input.signal,
  });

  const data = (await response.json()) as {
    calendars?: {
      primary?: {
        busy?: Array<{ start?: string; end?: string }>;
        errors?: Array<{ reason?: string; message?: string }>;
      };
    };
    error?: { message?: string };
  };

  if (!response.ok) {
    const error = new Error(data.error?.message ?? "Google Calendar request failed");
    Object.assign(error, { status: response.status });
    throw error;
  }

  const calendar = data.calendars?.primary;
  if (calendar?.errors?.length) {
    throw new Error(calendar.errors[0]?.message ?? "Google Calendar is unavailable");
  }

  return (calendar?.busy ?? [])
    .filter((busy): busy is { start: string; end: string } =>
      Boolean(busy.start && busy.end),
    )
    .map((busy) => ({ start: busy.start, end: busy.end }));
}
