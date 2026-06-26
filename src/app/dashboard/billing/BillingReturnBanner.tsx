"use client";

type Props = {
  success?: boolean;
  cancelled?: boolean;
};

export function BillingReturnBanner({ success, cancelled }: Props) {
  if (success) {
    return (
      <div
        role="status"
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
      >
        Payment received. Your plan will update shortly once PayHere confirms the subscription.
      </div>
    );
  }

  if (cancelled) {
    return (
      <div
        role="status"
        className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        Checkout was cancelled. You can try again whenever you are ready.
      </div>
    );
  }

  return null;
}
