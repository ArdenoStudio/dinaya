"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentStatus = "pending" | "success" | "failed" | "refunded" | null;

import type { BookingCopy } from "@/lib/i18n";

interface Props {
  bookingId: string;
  slug: string;
  copy: Pick<
    BookingCopy,
    | "paymentChecking"
    | "paymentConfirmedRefresh"
    | "paymentFailed"
    | "paymentStillPending"
    | "paymentStatusError"
  >;
}

export default function PaymentStatusPoller({ bookingId, slug, copy }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState(copy.paymentChecking);

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
          setMessage(copy.paymentConfirmedRefresh);
          router.refresh();
          stopped = true;
          return;
        }

        if (data.paymentStatus === "failed") {
          setMessage(copy.paymentFailed);
          stopped = true;
          return;
        }

        if (attempts >= 30) {
          setMessage(copy.paymentStillPending);
          stopped = true;
        }
      } catch {
        if (attempts >= 30) {
          setMessage(copy.paymentStatusError);
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
  }, [bookingId, copy, router, slug]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-6 rounded-xl border border-amber-100 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-left text-xs text-amber-900 dark:text-amber-200"
    >
      {message}
    </div>
  );
}
