"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentStatus = "pending" | "success" | "failed" | "refunded" | null;

interface Props {
  bookingId: string;
  slug: string;
}

export default function PaymentStatusPoller({ bookingId, slug }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("Checking PayHere confirmation...");

  useEffect(() => {
    let stopped = false;
    let attempts = 0;

    async function checkStatus() {
      attempts += 1;
      try {
        const params = new URLSearchParams({ bookingId, slug });
        const res = await fetch(`/api/bookings/status?${params.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = (await res.json()) as {
          confirmed?: boolean;
          paymentStatus?: PaymentStatus;
        };

        if (data.confirmed || data.paymentStatus === "success") {
          setMessage("Payment confirmed. Refreshing booking details...");
          router.refresh();
          stopped = true;
          return;
        }

        if (data.paymentStatus === "failed") {
          setMessage("Payment was not completed. Contact the business or try booking again.");
          stopped = true;
          return;
        }

        if (attempts >= 30) {
          setMessage("Payment is still pending. This page will update after PayHere confirms it.");
          stopped = true;
        }
      } catch {
        if (attempts >= 30) {
          setMessage("Payment status could not be refreshed. Check again in a few minutes.");
          stopped = true;
        }
      }
    }

    const intervalId = window.setInterval(() => {
      if (stopped) {
        window.clearInterval(intervalId);
        return;
      }
      void checkStatus();
    }, 3000);

    void checkStatus();

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [bookingId, router, slug]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-left text-xs text-amber-900"
    >
      {message}
    </div>
  );
}
