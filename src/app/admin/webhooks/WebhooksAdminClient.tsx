"use client";

import { useState, useTransition } from "react";
import { replayWebhookDelivery } from "../support/actions";

type DeliveryRow = {
  id: string;
  event: string;
  status: string;
  attempts: number;
  error: string | null;
  createdAt: string;
  webhookUrl: string;
  businessName: string;
};

export function WebhooksAdminClient({ deliveries }: { deliveries: DeliveryRow[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function replay(id: string) {
    setMessage("");
    startTransition(async () => {
      const result = await replayWebhookDelivery(id);
      setMessage(result.ok ? "Replay triggered." : result.error);
    });
  }

  return (
    <div className="space-y-4">
      {message && <p className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">{message}</p>}
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Attempts</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No failed webhook deliveries.
                </td>
              </tr>
            ) : (
              deliveries.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.businessName}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{row.webhookUrl}</p>
                  </td>
                  <td className="px-4 py-3">{row.event}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">{row.attempts}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => replay(row.id)}
                      className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                    >
                      Replay
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
