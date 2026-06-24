"use client";

import { useCallback, useEffect, useState } from "react";
import { buildServiceBookingPath } from "@/lib/booking-url";
import type { BookingService } from "@/components/booking/BookingWizard";

function resolveServiceSlug(service: BookingService): string {
  return service.slug ?? service.id;
}

function findServiceBySlug(services: BookingService[], slug: string | null): BookingService | null {
  if (!slug) return null;
  const normalized = slug.toLowerCase();
  return (
    services.find((service) => resolveServiceSlug(service).toLowerCase() === normalized) ??
    services.find((service) => service.id.toLowerCase() === normalized) ??
    null
  );
}

function readServiceSlugFromPathname(pathname: string, businessSlug: string): string | null {
  const prefix = `/book/${businessSlug}/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length).split("/")[0]?.trim();
  return rest || null;
}

export function useBookingHubNavigation(input: {
  businessSlug: string;
  services: BookingService[];
  initialService: BookingService | null;
  enabled: boolean;
}) {
  const [activeService, setActiveService] = useState<BookingService | null>(input.initialService);

  useEffect(() => {
    // Hub instant-nav owns activeService via selectService / popstate — never reset from parent.
    if (input.enabled) return;
    setActiveService(input.initialService);
  }, [input.enabled, input.initialService]);

  const selectService = useCallback(
    (service: BookingService) => {
      setActiveService(service);
      if (!input.enabled || typeof window === "undefined") return;
      const path = buildServiceBookingPath(input.businessSlug, resolveServiceSlug(service));
      window.history.pushState({ dinayaBookingService: resolveServiceSlug(service) }, "", path);
    },
    [input.businessSlug, input.enabled],
  );

  const clearService = useCallback(() => {
    setActiveService(null);
    if (!input.enabled || typeof window === "undefined") return;
    window.history.pushState({}, "", `/book/${input.businessSlug}`);
  }, [input.businessSlug, input.enabled]);

  useEffect(() => {
    if (!input.enabled || typeof window === "undefined") return;

    const syncFromUrl = () => {
      const slug = readServiceSlugFromPathname(window.location.pathname, input.businessSlug);
      setActiveService(findServiceBySlug(input.services, slug));
    };

    const onPopState = () => syncFromUrl();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [input.businessSlug, input.enabled, input.services]);

  return {
    activeService,
    selectService,
    clearService,
  };
}
