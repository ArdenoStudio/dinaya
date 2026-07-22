"use client";

import type { ComponentProps } from "react";
import { DocsProductFrame } from "./DocsProductFrame";

/** Shot-only frame for live product screenshots (no fake browser chrome). */
export function DocsScreenshotFrame(
  props: Omit<ComponentProps<typeof DocsProductFrame>, "variant" | "mockupId">,
) {
  return <DocsProductFrame {...props} variant="shot" />;
}
