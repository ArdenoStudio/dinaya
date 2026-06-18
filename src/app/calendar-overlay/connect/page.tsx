import { notFound } from "next/navigation";
import { verifyCalendarOverlayTicket } from "@/lib/calendar-overlay-ticket";
import CalendarOverlayConnector from "./CalendarOverlayConnector";

interface Props {
  searchParams: Promise<{ ticket?: string }>;
}

export default async function CalendarOverlayConnectPage({ searchParams }: Props) {
  const { ticket } = await searchParams;
  const payload = ticket ? verifyCalendarOverlayTicket(ticket) : null;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!payload || !clientId) notFound();

  return (
    <CalendarOverlayConnector
      clientId={clientId}
      targetOrigin={payload.origin}
      channel={payload.channel}
    />
  );
}
