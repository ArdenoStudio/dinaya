"use client";

import { useEffect } from "react";
import type { EmbedPrefillContact } from "./embed-events";
import { resolveEmbedParentOrigin } from "./embed-events";

export function useEmbedContactPrefill(
  embedMode: boolean,
  onPrefill: (contact: EmbedPrefillContact) => void,
) {
  useEffect(() => {
    if (!embedMode) return;

    const parentOrigin = resolveEmbedParentOrigin();
    if (!parentOrigin) return;

    function handleMessage(event: MessageEvent) {
      if (event.origin !== parentOrigin) return;
      if (!event.data || event.data.type !== "dinaya:prefill") return;

      const contact = event.data.contact;
      if (!contact || typeof contact !== "object") return;

      onPrefill({
        name: typeof contact.name === "string" ? contact.name : undefined,
        email: typeof contact.email === "string" ? contact.email : undefined,
        phone: typeof contact.phone === "string" ? contact.phone : undefined,
      });
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [embedMode, onPrefill]);
}
