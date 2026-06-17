"use client";

import { useState, useTransition } from "react";
import { refundPayment } from "./actions";

export function RefundPaymentForm() {
  const [paymentId, setPaymentId] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await refundPayment(paymentId.trim());
      setMessage(result.ok ? "Payment marked as refunded." : result.error);
    });
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5 space-y-3">
      <h2 className="font-semibold">Mark payment refunded</h2>
      <p className="text-sm text-muted-foreground">
        Sets a successful PayHere payment to refunded in Dinaya. Does not call PayHere APIs.
      </p>
      <input
        value={paymentId}
        onChange={(e) => setPaymentId(e.target.value)}
        placeholder="Payment UUID"
        className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
        required
      />
      {message && <p className="text-sm">{message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        Mark refunded
      </button>
    </form>
  );
}
