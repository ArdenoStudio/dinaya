"use client";

import { useMemo } from "react";
import {
  BookingsClient,
  type BookingsApi,
  type BookingRow,
  type BookingsTab,
} from "@/components/dashboard/BookingsClient";
import { buildDesktopApiPath, desktopApiRequest } from "../desktop-api";

type DesktopBookingsResponse = {
  rows: BookingRow[];
  nextCursor: string | null;
};

const desktopBookingsApi: BookingsApi = {
  async list(tab: BookingsTab, cursor?: string | null) {
    const response = await desktopApiRequest<DesktopBookingsResponse>({
      method: "GET",
      path: buildDesktopApiPath("/api/v1/desktop/bookings", {
        limit: 50,
        tab,
        ...(cursor ? { cursor } : {}),
      }),
    });
    return {
      bookings: response.rows,
      hasMore: Boolean(response.nextCursor),
      nextCursor: response.nextCursor,
    };
  },
  async updateStatus(bookingId, status) {
    const updated = await desktopApiRequest<{ status: BookingRow["status"] }>({
      method: "PATCH",
      path: `/api/v1/desktop/bookings/${bookingId}/status`,
      body: { status },
    });
    return updated;
  },
  exportUrl(tab) {
    return buildDesktopApiPath("/api/v1/desktop/bookings", {
      compat: "web",
      export: "csv",
      tab,
    });
  },
};

export function DashboardBookingsPage() {
  const api = useMemo(() => desktopBookingsApi, []);
  return <BookingsClient api={api} />;
}
