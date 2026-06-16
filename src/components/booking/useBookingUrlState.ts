"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type BookingUrlState = {
  date?: string;
  slot?: string;
  staffId?: string;
  dealId?: string;
  name?: string;
  email?: string;
  phone?: string;
  embed?: boolean;
  hideGallery?: boolean;
};

export function useBookingUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo<BookingUrlState>(() => {
    const embed = searchParams.get("embed");
    const hideGallery = searchParams.get("hideGallery");
    return {
      date: searchParams.get("date") ?? undefined,
      slot: searchParams.get("slot") ?? undefined,
      staffId: searchParams.get("staff") ?? undefined,
      dealId: searchParams.get("dealId") ?? undefined,
      name: searchParams.get("name") ?? undefined,
      email: searchParams.get("email") ?? undefined,
      phone: searchParams.get("phone") ?? undefined,
      embed: embed === "1" || embed === "true",
      hideGallery: hideGallery === "1" || hideGallery === "true",
    };
  }, [searchParams]);

  const setParams = useCallback(
    (updates: Partial<BookingUrlState>, options?: { replace?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());

      const apply = (key: string, value: string | undefined, paramKey = key) => {
        if (value === undefined) return;
        if (value === "") params.delete(paramKey);
        else params.set(paramKey, value);
      };

      apply("date", updates.date);
      apply("slot", updates.slot);
      apply("staffId", updates.staffId, "staff");
      apply("dealId", updates.dealId);
      apply("name", updates.name);
      apply("email", updates.email);
      apply("phone", updates.phone);

      if (updates.embed !== undefined) {
        if (updates.embed) params.set("embed", "1");
        else params.delete("embed");
      }
      if (updates.hideGallery !== undefined) {
        if (updates.hideGallery) params.set("hideGallery", "1");
        else params.delete("hideGallery");
      }

      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      if (options?.replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { state, setParams };
}

export function useBookingUrlSync(input: {
  date: string;
  slotStartUtc: string;
  staffId: string | null;
  dealId: string | null;
  enabled?: boolean;
}) {
  const { setParams } = useBookingUrlState();

  useEffect(() => {
    if (input.enabled === false) return;
    setParams(
      {
        date: input.date || "",
        slot: input.slotStartUtc || "",
        staffId: input.staffId || "",
        dealId: input.dealId || "",
      },
      { replace: true },
    );
  }, [input.date, input.slotStartUtc, input.staffId, input.dealId, input.enabled, setParams]);
}
