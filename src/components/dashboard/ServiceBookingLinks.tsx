"use client";

import { useEffect, useState } from "react";
import { buildServiceBookingUrl } from "@/lib/booking-url";
import { buildEmbedIframeSnippet } from "@/lib/booking/embed";

type ServiceLink = {
  id: string;
  name: string;
  slug: string | null;
};

export function ServiceBookingLinks({
  slug,
  customDomain,
  customDomainVerified,
  services,
}: {
  slug: string;
  customDomain?: string | null;
  customDomainVerified?: boolean | null;
  services: ServiceLink[];
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedId) return;
    const timeoutId = window.setTimeout(() => setCopiedId(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copiedId]);

  if (services.length === 0) return null;

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
  }

  return (
    <div className="rounded-xl border bg-white p-5">
      <h2 className="mb-3 font-semibold">Per-service booking links</h2>
      <div className="space-y-3">
        {services.map((service) => {
          const url = buildServiceBookingUrl(
            { slug, customDomain, customDomainVerified },
            service.slug ?? service.id,
          );
          const embed = buildEmbedIframeSnippet(slug, service.slug ?? undefined);
          return (
            <div key={service.id} className="rounded-lg border p-3">
              <p className="font-medium">{service.name}</p>
              <code className="mt-2 block truncate rounded-md bg-muted/30 px-2 py-1 text-xs text-primary">
                {url}
              </code>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copy(url, `${service.id}-url`)}
                  className="rounded-md border px-2 py-1 text-xs font-medium hover:border-primary/40"
                >
                  {copiedId === `${service.id}-url` ? "Copied" : "Copy link"}
                </button>
                <button
                  type="button"
                  onClick={() => copy(embed, `${service.id}-embed`)}
                  className="rounded-md border px-2 py-1 text-xs font-medium hover:border-primary/40"
                >
                  {copiedId === `${service.id}-embed` ? "Copied" : "Copy embed"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
