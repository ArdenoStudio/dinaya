import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// 'unsafe-eval' is only required in development (React Fast Refresh / eval source maps).
// Production builds do not need it, so we drop it to shrink the XSS attack surface.
const scriptSrc = [
  "script-src 'self' 'unsafe-inline'",
  isDev ? "'unsafe-eval'" : "",
  "https://vercel.live https://va.vercel-scripts.com https://accounts.google.com/gsi/client",
]
  .filter(Boolean)
  .join(" ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-src 'self' https://www.payhere.lk https://sandbox.payhere.lk https://vercel.live https://accounts.google.com/gsi/",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://www.payhere.lk https://sandbox.payhere.lk",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "react-bootstrap-icons",
      "@hugeicons/react",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.dinaya.lk" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "api.qrserver.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/auth/signin",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
      {
        source: "/docs",
        has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }],
        destination: "/docs/markdown",
      },
      {
        source: "/docs/guides/:slug",
        has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }],
        destination: "/docs/guides/:slug/markdown",
      },
      {
        source: "/docs/reference/:slug",
        has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }],
        destination: "/docs/reference/:slug/markdown",
      },
      {
        source: "/docs.md",
        destination: "/docs/markdown",
      },
      {
        source: "/docs/guides/:slug.md",
        destination: "/docs/guides/:slug/markdown",
      },
      {
        source: "/docs/reference/:slug.md",
        destination: "/docs/reference/:slug/markdown",
      },
      {
        source: "/llms.txt",
        destination: "/llms",
      },
      ],
    };
  },
};

export default nextConfig;
