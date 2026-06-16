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
    <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 text-left">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {labels.addToCalendar}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Icon name="calendar-event-fill" className="text-sm" />
          {labels.googleCalendar}
        </Link>
        <a
          href={icsUrl}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Icon name="download" className="text-sm" />
          {labels.downloadIcs}
        </a>
      </div>
    </div>
  );
}
