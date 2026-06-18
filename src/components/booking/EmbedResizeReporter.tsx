"use client";

import { useEffect } from "react";
import { postEmbedEvent } from "./embed-events";

export default function EmbedResizeReporter({ slug }: { slug?: string }) {
  useEffect(() => {
    const root = document.querySelector("[data-booking-embed-root]");
    if (!root || window.parent === window) return;

    function postHeight() {
      const height = Math.ceil(root!.getBoundingClientRect().height);
      postEmbedEvent({ type: "dinaya:resize", height });
    }

    postHeight();
    const observer = new ResizeObserver(postHeight);
    observer.observe(root);
    window.addEventListener("load", postHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("load", postHeight);
    };
  }, []);

  useEffect(() => {
    if (!slug || window.parent === window) return;
    postEmbedEvent({ type: "dinaya:ready", slug });
  }, [slug]);

  return null;
}
