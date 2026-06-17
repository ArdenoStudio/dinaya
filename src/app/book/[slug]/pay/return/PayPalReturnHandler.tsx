"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

interface Props {
  slug: string;
  copy: {
    redirectingToPayment: string;
  };
}

export default function PayPalReturnHandler({ slug, copy }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const orderId = searchParams.get("token");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId || !orderId) {
      setError("Missing payment details.");
      return;
    }

    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/bookings/${bookingId}/paypal-capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, slug }),
      });
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error ?? "Payment could not be confirmed.");
        return;
      }
      router.replace(`/book/${slug}/confirmed?bookingId=${bookingId}`);
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId, orderId, router, slug]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <Icon name="exclamation-circle" className="mb-3 text-2xl text-red-400" />
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
      <p className="text-sm text-gray-500">{copy.redirectingToPayment}</p>
    </div>
  );
}
