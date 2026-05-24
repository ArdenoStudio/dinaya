import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLkr(amountLkr: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
  }).format(amountLkr);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateOrderId(): string {
  return `DIN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

export function isOptimizableRemoteImage(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return false;
    return (
      hostname === "res.cloudinary.com" ||
      hostname === "api.qrserver.com" ||
      hostname.endsWith(".dinaya.lk") ||
      hostname === "dinaya.lk"
    );
  } catch {
    return url.startsWith("/");
  }
}
