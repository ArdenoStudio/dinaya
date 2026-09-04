"use client";

import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";

export function GoogleCalendarDisconnect() {
  async function disconnect() {
    await fetch("/api/dashboard/integrations/google", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <ConfirmDialog
      title="Disconnect Google Calendar"
      description="Confirmed bookings will stop syncing to this calendar. You can reconnect at any time."
      confirmLabel="Disconnect"
      onConfirm={disconnect}
      trigger={
        <button
          type="button"
          className="mt-4 text-sm font-medium text-red-600 hover:underline"
        >
          Disconnect
        </button>
      }
    />
  );
}
