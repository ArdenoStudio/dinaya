import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "dinaya.lk";

function appUrl(req: NextRequest, path: string): URL {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    req.nextUrl.host;

  return new URL(path, `${proto}://${host}`);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get("host") ?? "";

  // Strip port for local dev comparison
  const hostWithoutPort = hostname.split(":")[0];
  const rootDomain = APP_DOMAIN.split(":")[0];

  // Check if this is a business subdomain (e.g. salon-abc.dinaya.lk)
  const isSubdomain =
    hostWithoutPort !== rootDomain &&
    hostWithoutPort !== `www.${rootDomain}` &&
    hostWithoutPort.endsWith(`.${rootDomain}`);

  if (isSubdomain) {
    const slug = hostWithoutPort.replace(`.${rootDomain}`, "");
    // Rewrite to /book/[slug] while preserving the original URL
    return NextResponse.rewrite(
      appUrl(req, `/book/${slug}${pathname}`)
    );
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!req.auth) {
      return NextResponse.redirect(appUrl(req, "/auth/signin"));
    }
  }

  // Protect platform admin routes (allowlist enforcement happens in the layout)
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      return NextResponse.redirect(
        appUrl(req, `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`)
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
