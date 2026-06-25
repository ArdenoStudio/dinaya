import Link from "next/link";
import { buildGoogleCalendarUrl } from "@/lib/calendar-ics";
import { Icon } from "@/components/ui/Icon";

interface Props {
  bookingId: string;
  slug: string;
  title: string;
  description: string;
  location?: string;
  startsAt: Date;
  endsAt: Date;
  labels: {
    addToCalendar: string;
    downloadIcs: string;
    googleCalendar: string;
  };
}

export default function AddToCalendar({
  bookingId,
  slug,
  title,
  description,
  location,
  startsAt,
  endsAt,
  labels,
}: Props) {
  const googleUrl = buildGoogleCalendarUrl({
    title,
    description,
    location,
    startsAt,
    endsAt,
  });
  const icsUrl = `/api/bookings/${bookingId}/calendar.ics?slug=${encodeURIComponent(slug)}`;

  return (
    <div className="text-left">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {labels.addToCalendar}
      </p>
      <div className="flex flex-col gap-2">
        <Link
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--booking-accent)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Icon name="calendar-event-fill" className="text-sm" />
          {labels.googleCalendar}
        </Link>
        <a
          href={icsUrl}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Icon name="download" className="text-sm" />
          {labels.downloadIcs}
        </a>
      </div>
    </div>
  );
}
