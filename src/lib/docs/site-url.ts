const LOCAL_FALLBACK = "http://localhost:3000";

function getRawAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? LOCAL_FALLBACK).trim();
}

export function getAppOrigin(): string {
  const raw = getRawAppUrl();

  try {
    return new URL(raw).origin;
  } catch {
    const withScheme =
      raw.startsWith("localhost") || raw.startsWith("127.0.0.1")
        ? `http://${raw}`
        : `https://${raw}`;

    try {
      return new URL(withScheme).origin;
    } catch {
      return LOCAL_FALLBACK;
    }
  }
}

export function buildAbsoluteAppUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, `${getAppOrigin()}/`).toString();
}

