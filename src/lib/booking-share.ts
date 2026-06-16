import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export function buildBookingShareText(input: {
  businessName: string;
  serviceName: string;
  startsAt: Date;
  timezone: string;
  manageUrl?: string;
}): string {
  const local = toZonedTime(input.startsAt, input.timezone);
  const when = `${format(local, "EEE d MMM yyyy")} at ${format(local, "h:mm a")}`;
  const lines = [
    `My appointment at ${input.businessName}`,
    `${input.serviceName} · ${when}`,
  ];
  if (input.manageUrl) {
    lines.push(`Manage: ${input.manageUrl}`);
  }
  return lines.join("\n");
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
