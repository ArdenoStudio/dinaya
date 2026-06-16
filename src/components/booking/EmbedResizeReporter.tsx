"use client";

import { useEffect } from "react";

export default function EmbedResizeReporter() {
  useEffect(() => {
    const root = document.querySelector("[data-booking-embed-root]");
    if (!root || window.parent === window) return;

    function postHeight() {
      const height = Math.ceil(root!.getBoundingClientRect().height);
      window.parent.postMessage({ type: "dinaya:resize", height }, "*");
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

  return null;
}
