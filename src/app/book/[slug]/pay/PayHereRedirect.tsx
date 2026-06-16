"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

interface Props {
  slug: string;
  copy: {
    redirectingToPayment: string;
    payNow: string;
    paymentRedirectHint: string;
  };
}

export default function PayHereRedirect({ slug, copy }: Props) {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const formRef = useRef<HTMLFormElement | null>(null);
  const [checkout, setCheckout] = useState<{
    payhereFormData: Record<string, string>;
    payhereUrl: string;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) {
      setError("Missing booking reference.");
      return;
    }

    let cancelled = false;
    (async () => {
      const params = new URLSearchParams({ slug });
      const res = await fetch(`/api/bookings/${bookingId}/payhere-checkout?${params.toString()}`);
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error ?? "Unable to start PayHere checkout.");
        return;
      }
      setCheckout({
        payhereFormData: data.payhereFormData,
        payhereUrl: data.payhereUrl,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId, slug]);

  useEffect(() => {
    if (!checkout) return;
    const timeoutId = window.setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [checkout]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <Icon name="exclamation-circle" className="mb-3 text-2xl text-red-400" />
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
        <p className="text-sm text-gray-500">{copy.redirectingToPayment}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
        <Icon name="credit-card" className="text-2xl text-primary" />
      </div>
      <h1 className="mb-2 font-cal text-xl text-gray-900">{copy.redirectingToPayment}</h1>
      <p className="mb-6 text-sm text-gray-500">{copy.paymentRedirectHint}</p>
      <form ref={formRef} method="POST" action={checkout.payhereUrl}>
        {Object.entries(checkout.payhereFormData).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <button
          type="submit"
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
        >
          {copy.payNow}
        </button>
      </form>
    </div>
  );
}
