import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/auth.config";
import { lookupCustomDomainSlug } from "@/lib/custom-domain";

const { auth } = NextAuth(authConfig);

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "dinaya.lk";

function redirectOnSameOrigin(req: NextRequest, pathname: string): URL {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  return url;
}

function rewriteUrl(req: NextRequest, path: string): URL {
  const url = req.nextUrl.clone();
  url.pathname = path;
  return url;
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get("host") ?? "";

  const hostWithoutPort = hostname.split(":")[0];
  const rootDomain = APP_DOMAIN.split(":")[0];

  const isRootHost =
    hostWithoutPort === rootDomain || hostWithoutPort === `www.${rootDomain}`;

  const isSubdomain =
    !isRootHost && hostWithoutPort.endsWith(`.${rootDomain}`);

  if (isSubdomain) {
    const slug = hostWithoutPort.replace(`.${rootDomain}`, "");
    return NextResponse.rewrite(rewriteUrl(req, `/book/${slug}${pathname}`));
  }

  if (!isRootHost) {
    const customSlug = await lookupCustomDomainSlug(hostWithoutPort);
    if (customSlug) {
      return NextResponse.rewrite(rewriteUrl(req, `/book/${customSlug}${pathname}`));
    }
  }

  if (pathname === "/login") {
    const signInUrl = redirectOnSameOrigin(req, "/auth/signin");
    signInUrl.search = req.nextUrl.search;
    return NextResponse.redirect(signInUrl);
  }

  if (pathname.startsWith("/dashboard")) {
    if (!req.auth) {
      return NextResponse.redirect(redirectOnSameOrigin(req, "/auth/signin"));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const signInUrl = redirectOnSameOrigin(req, "/auth/signin");
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
