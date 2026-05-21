import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { resolveSlugFromCustomDomain } from "@/lib/custom-domains";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "dinaya.lk";

function appUrl(req: NextRequest, path: string): URL {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    req.nextUrl.host;

  return new URL(path, `${proto}://${host}`);
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get("host") ?? "";

  const hostWithoutPort = hostname.split(":")[0];
  const rootDomain = APP_DOMAIN.split(":")[0];

  const isRootHost =
    hostWithoutPort === rootDomain ||
    hostWithoutPort === `www.${rootDomain}`;

  const isSubdomain =
    !isRootHost &&
    hostWithoutPort.endsWith(`.${rootDomain}`);

  if (isSubdomain) {
    const slug = hostWithoutPort.replace(`.${rootDomain}`, "");
    return NextResponse.rewrite(
      appUrl(req, `/book/${slug}${pathname}`),
    );
  }

  if (!isRootHost && !isSubdomain) {
    const slug = await resolveSlugFromCustomDomain(hostWithoutPort);
    if (slug) {
      return NextResponse.rewrite(
        appUrl(req, `/book/${slug}${pathname}`),
      );
    }
  }

  if (pathname === "/login") {
    const signInUrl = appUrl(req, "/auth/signin");
    signInUrl.search = req.nextUrl.search;
    return NextResponse.redirect(signInUrl);
  }

  if (pathname.startsWith("/dashboard")) {
    if (!req.auth) {
      return NextResponse.redirect(appUrl(req, "/auth/signin"));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      return NextResponse.redirect(
        appUrl(req, `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`),
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
