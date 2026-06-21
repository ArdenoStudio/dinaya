"use client";

import { useMemo } from "react";
import {
  BookingsClient,
  type BookingsApi,
  type BookingRow,
  type BookingsTab,
} from "@/components/dashboard/BookingsClient";
import { buildDesktopApiPath, desktopApiRequest } from "../desktop-api";

const desktopBookingsApi: BookingsApi = {
  async list(tab: BookingsTab) {
    return desktopApiRequest<BookingRow[]>({
      method: "GET",
      path: buildDesktopApiPath("/api/v1/desktop/bookings", {
        compat: "web",
        limit: 100,
        tab,
      }),
    });
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
