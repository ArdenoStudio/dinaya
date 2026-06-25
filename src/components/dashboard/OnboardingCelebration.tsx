"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { dashboardOutlineActionClass, dashboardPrimaryActionClass } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

type Props = {
  bookingUrl: string;
  bookingDisplayUrl: string;
};

export function OnboardingCelebration({ bookingUrl, bookingDisplayUrl }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("onboarded") === "1") {
      setVisible(true);
    }
  }, [searchParams]);

  function dismiss() {
    setVisible(false);
    router.replace("/dashboard", { scroll: false });
  }

  if (!visible) return null;

  return (
    <div
      className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800/50 dark:bg-emerald-950/40"
      role="status"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <Icon name="check-circle-fill" className="mt-0.5 shrink-0 text-2xl text-emerald-600" />
          <div>
            <h2 className="font-cal text-xl tracking-tight">Your booking link is live</h2>
            <p className="mt-1 text-[17px] leading-snug text-muted-foreground sm:text-sm">
              Share it on WhatsApp or drop it in your Instagram bio — clients can book without another
              DM thread.
            </p>
            <p className="mt-2 text-sm font-medium text-primary">{bookingDisplayUrl}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="self-start text-sm text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <Icon name="x-lg" />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className={dashboardPrimaryActionClass}>
          <Icon name="box-arrow-up-right" className="text-xs" />
          Preview booking page
        </a>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(dashboardOutlineActionClass, "min-h-11")}
        >
          Book yourself (test)
        </a>
        <button type="button" onClick={dismiss} className={dashboardOutlineActionClass}>
          Go to dashboard
        </button>
      </div>
    </div>
  );
}
