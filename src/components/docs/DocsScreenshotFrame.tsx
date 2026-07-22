"use client";

import type { ComponentProps } from "react";
import { DocsProductFrame } from "./DocsProductFrame";

/** Shot-only frame for live product screenshots. */
export function DocsScreenshotFrame(props: ComponentProps<typeof DocsProductFrame>) {
  return <DocsProductFrame {...props} />;
}
