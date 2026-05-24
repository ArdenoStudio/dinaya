"use client";

export function GoogleCalendarDisconnect() {
  async function disconnect() {
    await fetch("/api/dashboard/integrations/google", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={disconnect}
      className="mt-4 text-sm font-medium text-red-600 hover:underline"
    >
      Disconnect
    </button>
  );
}
