import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { socialConnections } from "@/db/schema";
import {
  GOOGLE_PROVIDER,
  queryGoogleCalendarFreeBusy,
  refreshGoogleAccessToken,
} from "@/lib/google-calendar";
import { decryptSecret, encryptSecret } from "@/lib/secrets";
import type { DemandSourceStatus } from "@/lib/deals/demand";

type ConnectionMeta = {
  refreshTokenEncrypted?: string;
  calendarId?: string;
};

export type ExternalBusyWindow = {
  startsAt: Date;
  endsAt: Date;
  source: "google_calendar";
};

export type ExternalBusyResult = {
  busyWindows: ExternalBusyWindow[];
  sourceStatus: DemandSourceStatus;
};

export async function loadGoogleCalendarBusyWindows(input: {
  businessId: string;
  timeMin: Date;
  timeMax: Date;
  timezone: string;
}): Promise<ExternalBusyResult> {
  const [connection] = await db
    .select()
    .from(socialConnections)
    .where(and(
      eq(socialConnections.businessId, input.businessId),
      eq(socialConnections.provider, GOOGLE_PROVIDER),
      eq(socialConnections.isActive, true),
    ))
    .limit(1);

  if (!connection) {
    return {
      busyWindows: [],
      sourceStatus: {
        source: "google_calendar",
        status: "not_connected",
        label: "Google Calendar is not connected",
      },
    };
  }

  const meta = (connection.meta as ConnectionMeta | null) ?? {};
  const refreshToken = meta.refreshTokenEncrypted
    ? decryptSecret(meta.refreshTokenEncrypted)
    : null;
  let accessToken = connection.accessTokenEncrypted
    ? decryptSecret(connection.accessTokenEncrypted)
    : null;

  if (!accessToken && refreshToken) {
    accessToken = await refreshGoogleAccessToken(refreshToken);
    await db
      .update(socialConnections)
      .set({ accessTokenEncrypted: encryptSecret(accessToken) })
      .where(eq(socialConnections.id, connection.id));
  }

  if (!accessToken) {
    return {
      busyWindows: [],
      sourceStatus: {
        source: "google_calendar",
        status: "unavailable",
        label: "Google Calendar token is missing",
      },
    };
  }

  try {
    const busyWindows = await queryGoogleCalendarFreeBusy({
      accessToken,
      calendarId: meta.calendarId,
      timeMin: input.timeMin,
      timeMax: input.timeMax,
      timeZone: input.timezone,
    });

    return {
      busyWindows: busyWindows.map((window) => ({ ...window, source: "google_calendar" })),
      sourceStatus: {
        source: "google_calendar",
        status: "used",
        label: `${busyWindows.length} Google Calendar busy window${busyWindows.length === 1 ? "" : "s"} checked`,
        busyWindowCount: busyWindows.length,
      },
    };
  } catch (error) {
    console.error("[deal-suggestions] Google Calendar free/busy failed", error);
    return {
      busyWindows: [],
      sourceStatus: {
        source: "google_calendar",
        status: "unavailable",
        label: "Google Calendar free/busy check failed",
      },
    };
  }
}
