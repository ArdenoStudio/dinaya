"use client";

import { useEffect } from "react";
import "lenis/dist/lenis.css";

export function SmoothScroll() {
  useEffect(() => {
    history.scrollRestoration = "manual";

    let lenis: import("lenis").default | null = null;
    let rafId: number;

    const init = async () => {
      const { default: Lenis } = await import("lenis");
      lenis = new Lenis();

      const raf = (time: number) => {
        lenis!.raf(time);
        rafId = requestAnimationFrame(raf);
      };

      rafId = requestAnimationFrame(raf);
    };

    const events = ["touchstart", "wheel", "keydown", "pointerdown"] as const;
    events.forEach((e) =>
      window.addEventListener(e, init, { passive: true, once: true })
    );

    return () => {
      events.forEach((e) => window.removeEventListener(e, init));
      lenis?.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
