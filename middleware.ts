import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/auth.config";
import { lookupCustomDomainSlug } from "@/lib/custom-domain";

const { auth } = NextAuth(authConfig);

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "dinaya.lk";
const DEFAULT_APP_ORIGIN = APP_DOMAIN.startsWith("localhost") || APP_DOMAIN.startsWith("127.")
  ? `http://${APP_DOMAIN}`
  : `https://${APP_DOMAIN}`;
const APP_ORIGIN = (process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_ORIGIN).replace(/\/$/, "");

function trustedAppUrl(path: string): URL {
  return new URL(path, APP_ORIGIN);
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
    const signInUrl = trustedAppUrl("/auth/signin");
    signInUrl.search = req.nextUrl.search;
    return NextResponse.redirect(signInUrl);
  }

  if (pathname.startsWith("/dashboard")) {
    if (!req.auth) {
      return NextResponse.redirect(trustedAppUrl("/auth/signin"));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      return NextResponse.redirect(
        trustedAppUrl(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`),
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
