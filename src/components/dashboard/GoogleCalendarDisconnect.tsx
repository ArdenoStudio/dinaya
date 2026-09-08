"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";

export function GoogleCalendarDisconnect() {
  const [open, setOpen] = useState(false);

  async function disconnect() {
    await fetch("/api/dashboard/integrations/google", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <>
      <button
        type="button"
        className="mt-4 text-sm font-medium text-red-600 hover:underline"
        onClick={() => setOpen(true)}
      >
        Disconnect
      </button>
      <ConfirmDialog
        title="Disconnect Google Calendar"
        description="Confirmed bookings will stop syncing to this calendar. You can reconnect at any time."
        confirmLabel="Disconnect"
        variant="destructive"
        onConfirm={disconnect}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
