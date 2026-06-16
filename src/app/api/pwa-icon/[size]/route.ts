import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createElement } from "react";

const SUPPORTED_SIZES = new Set([192, 512]);

type RouteContext = {
  params: Promise<unknown>;
};

function parseIconSize(value: string): 192 | 512 {
  const size = Number.parseInt(value, 10);
  return SUPPORTED_SIZES.has(size) ? (size as 192 | 512) : 192;
}

function readSizeParam(params: unknown): string {
  if (!params || typeof params !== "object" || !("size" in params)) return "";

  const value = (params as { size?: unknown }).size;
  if (Array.isArray(value)) return String(value[0] ?? "");
  return typeof value === "string" ? value : "";
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const size = parseIconSize(readSizeParam(await params));
  const markSize = Math.round(size * 0.44);
  const radius = Math.round(size * 0.22);

  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
          borderRadius: `${radius}px`,
          color: "#ffffff",
          fontFamily: "serif",
          fontSize: markSize,
          fontWeight: 700,
        },
      },
      "D",
    ),
    {
      height: size,
      width: size,
    },
  );
}
