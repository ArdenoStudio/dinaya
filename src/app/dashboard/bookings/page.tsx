"use client";

import { BookingsClient, type BookingsApi } from "@/components/dashboard/BookingsClient";

const webBookingsApi: BookingsApi = {
  async list(tab) {
    const response = await fetch(`/api/dashboard/bookings?tab=${tab}`);
    return response.json();
  },
  async updateStatus(bookingId, status) {
    const response = await fetch(`/api/dashboard/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) return null;
    return response.json();
  },
  exportUrl(tab) {
    return `/api/dashboard/bookings?tab=${tab}&export=csv`;
  },
};

export default function BookingsPage() {
  return <BookingsClient api={webBookingsApi} />;
}
