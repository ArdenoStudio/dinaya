import { z } from "@/lib/validation";

const ABSOLUTE_URL_RE = /^https:\/\/[^\s/$.?#].[^\s]*$/i;
/** Same-site paths only — reject protocol-relative URLs like //evil.com */
const RELATIVE_PATH_RE = /^\/(?!\/)[a-zA-Z0-9/_\-?=&%.]*$/;

export const successRedirectUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => ABSOLUTE_URL_RE.test(value) || RELATIVE_PATH_RE.test(value), {
    message: "Enter an https:// URL or a same-site path starting with /.",
  })
  .optional()
  .nullable();

export function parseSuccessRedirectUrl(value: unknown): string | null {
  const parsed = successRedirectUrlSchema.safeParse(value);
  return parsed.success ? parsed.data ?? null : null;
}

export type SuccessRedirectContext = {
  bookingId: string;
  service: string;
  staff: string;
  status: string;
  startsAt: string;
};

export function buildSuccessRedirectUrl(
  template: string,
  context: SuccessRedirectContext,
): string {
  const params = new URLSearchParams({
    bookingId: context.bookingId,
    service: context.service,
    staff: context.staff,
    status: context.status,
    startsAt: context.startsAt,
  });

  if (ABSOLUTE_URL_RE.test(template)) {
    const url = new URL(template);
    params.forEach((value, key) => {
      if (!url.searchParams.has(key)) url.searchParams.set(key, value);
    });
    return url.toString();
  }

  const separator = template.includes("?") ? "&" : "?";
  return `${template}${separator}${params.toString()}`;
}
