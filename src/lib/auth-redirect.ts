/**
 * Auth.js redirect callback — keep relative paths on the current browser host.
 * Prepend-only resolution against AUTH_URL can send users to a stale deployment.
 */
export function resolveAuthRedirect(url: string, baseUrl: string): string {
  if (url.startsWith("/")) return url;

  try {
    const target = new URL(url);
    const base = new URL(baseUrl);
    if (target.origin === base.origin) return url;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    if (appUrl) {
      const appOrigin = new URL(appUrl).origin;
      if (target.origin === appOrigin) return url;
    }

    // Trust the current Vercel deployment URL (set automatically on all
    // Vercel deployments — covers preview branches and production aliases).
    for (const key of ["VERCEL_URL", "VERCEL_PROJECT_PRODUCTION_URL"] as const) {
      const vercelHost = process.env[key];
      if (vercelHost && target.hostname === vercelHost.split("/")[0]) return url;
    }

    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "dinaya.lk";
    const rootHost = domain.split(":")[0];
    const allowedHosts = new Set([rootHost, `www.${rootHost}`]);
    if (allowedHosts.has(target.hostname)) return url;
  } catch {
    // fall through
  }

  return "/dashboard";
}
