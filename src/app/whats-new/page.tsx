"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { FadeContainer, FadeDiv } from "@/components/Fade";
import { motion, AnimatePresence } from "motion/react";
import { LandingFooter } from "@/components/LandingFooter";
import { Icon } from "@/components/ui/Icon";

type FilterTag = "all" | "feature" | "improvement" | "fix";

const tagConfig = {
  feature: {
    label: "New",
    badgeClass: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/80",
    iconBgClass: "bg-primary/10 text-primary",
    dotClass: "bg-primary",
  },
  improvement: {
    label: "Improved",
    badgeClass: "bg-violet-50 text-violet-700 ring-1 ring-violet-200/80",
    iconBgClass: "bg-violet-50 text-violet-600",
    dotClass: "bg-violet-500",
  },
  fix: {
    label: "Fixed",
    badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80",
    iconBgClass: "bg-amber-50 text-amber-600",
    dotClass: "bg-amber-500",
  },
} as const;

const releases = [
  {
    version: "v1.5",
    date: "May 2026",
    isLatest: true,
    highlight: "Deals, plan gating & stability fixes",
    changes: [
      {
        type: "feature" as const,
        icon: "tag-fill",
        title: "Dinaya Deals",
        desc: "Post flash discounts on slow appointment slots. Clients discover deals on Dinaya, book at discounted prices, and you track impressions and conversions in Reports.",
      },
      {
        type: "improvement" as const,
        icon: "mic-fill",
        title: "AI voice receptionist coming soon",
        desc: "Voice bookings are being prepared for a later rollout. Setup requests, voice API keys, and voice-created bookings are paused for now.",
      },
      {
        type: "feature" as const,
        icon: "broadcast-pin",
        title: "Plan gating & broadcast messages",
        desc: "Plan limits are now enforced across the dashboard. Growth plan users can send broadcast messages to clients from a new status panel.",
      },
      {
        type: "improvement" as const,
        icon: "layout-sidebar-fill",
        title: "New dashboard sidebar",
        desc: "The dashboard navigation has been redesigned with a collapsible macOS-style sidebar, grouped sections, and a sticky plan usage indicator at the bottom.",
      },
      {
        type: "fix" as const,
        icon: "person-check-fill",
        title: "Registration was returning 503",
        desc: "A slow Upstash rate-limit check was timing out the signup function before the account could be created. Fixed with a fast fallback to in-memory rate limiting.",
      },
      {
        type: "fix" as const,
        icon: "shield-fill-check",
        title: "Security hardening across auth and payments",
        desc: "Completed a full audit — tightened auth token handling, payment webhook validation, and API input sanitisation.",
      },
      {
        type: "fix" as const,
        icon: "phone-fill",
        title: "Mobile booking date/time layout",
        desc: "Date and time pickers were overflowing on narrow screens. The booking wizard now renders cleanly on all phone sizes.",
      },
    ],
  },
  {
    version: "v1.4",
    date: "May 2026",
    isLatest: false,
    highlight: "Discover directory, custom domains & landing page",
    changes: [
      {
        type: "feature" as const,
        icon: "search",
        title: "Discover directory",
        desc: "Businesses on Dinaya now appear in a public directory at dinaya.lk/discover — helping clients find local service providers by category.",
      },
      {
        type: "feature" as const,
        icon: "globe2",
        title: "Custom domain provisioning",
        desc: "Point your own domain to your Dinaya booking page. Domain verification and SSL are handled automatically.",
      },
      {
        type: "improvement" as const,
        icon: "display-fill",
        title: "Landing page demo carousel",
        desc: "The homepage now features a narrative product demo showing the booking flow in action, alongside fresh trust signals and social proof.",
      },
      {
        type: "improvement" as const,
        icon: "lightning-charge-fill",
        title: "Faster page loads — inline SVG icons",
        desc: "Replaced the Bootstrap Icons webfont with inline SVGs. Pages no longer block rendering on a font download, cutting load time on mobile.",
      },
      {
        type: "fix" as const,
        icon: "link-45deg",
        title: "Booking URL protocol fix",
        desc: "Booking links in dashboard emails were missing the https:// prefix on some environments, causing broken links. Resolved.",
      },
    ],
  },
  {
    version: "v1.3",
    date: "May 2026",
    isLatest: false,
    highlight: "Documentation hub, performance & platform hardening",
    changes: [
      {
        type: "feature" as const,
        icon: "book-fill",
        title: "Documentation hub",
        desc: "A full help centre at dinaya.lk/help — step-by-step guides for setup, payments, staff management, and integrations, with live UI walkthroughs.",
      },
      {
        type: "improvement" as const,
        icon: "speedometer",
        title: "Performance improvements",
        desc: "Reduced LCP and main-thread work on the homepage. Also replaced the icon webfont with inline SVGs to eliminate a render-blocking resource.",
      },
      {
        type: "improvement" as const,
        icon: "grid-1x2-fill",
        title: "Mega menu navigation",
        desc: "The public nav now has full-width mega menus under Features, Solutions, and Resources — making it easier for visitors to find what they're looking for.",
      },
      {
        type: "fix" as const,
        icon: "box-arrow-right",
        title: "Auth redirect fixes",
        desc: "Sign-out now correctly stays on the current host. Several login page routing edge cases were also resolved.",
      },
    ],
  },
  {
    version: "v1.2",
    date: "May 2026",
    isLatest: false,
    highlight: "PayHere payments, CRM & advanced service controls",
    changes: [
      {
        type: "feature" as const,
        icon: "credit-card-2-front-fill",
        title: "PayHere payment gateway",
        desc: "Accept card and mobile wallet payments through PayHere. Set per-service deposits to reduce no-shows at checkout.",
      },
      {
        type: "feature" as const,
        icon: "people-fill",
        title: "CRM — clients, pipeline & notes",
        desc: "Every client who books gets a profile automatically. Track pipeline stages, add notes, and see the full booking history per client.",
      },
      {
        type: "feature" as const,
        icon: "sliders",
        title: "Advanced service controls",
        desc: "Set buffer times before and after appointments, minimum booking notice, daily capacity limits, and custom date overrides for holidays.",
      },
      {
        type: "feature" as const,
        icon: "plug-fill",
        title: "Webhooks with HMAC signing",
        desc: "Subscribe to booking events via webhooks — signed with HMAC so you can safely trigger automations in your own systems.",
      },
    ],
  },
  {
    version: "v1.0",
    date: "May 2026",
    isLatest: false,
    highlight: "Dinaya launches — booking, dashboard & calendar",
    changes: [
      {
        type: "feature" as const,
        icon: "rocket-takeoff-fill",
        title: "Dinaya is live",
        desc: "Online booking, a clean dashboard, and a public booking page at yourname.dinaya.lk — everything needed to stop taking appointments over WhatsApp.",
      },
      {
        type: "feature" as const,
        icon: "calendar-event-fill",
        title: "Dashboard calendar & manual booking",
        desc: "View all upcoming appointments in a calendar, create manual bookings from the dashboard, and manage booking status and reminders in one place.",
      },
      {
        type: "feature" as const,
        icon: "chat-dots-fill",
        title: "WhatsApp reminders & CSV export",
        desc: "Automated WhatsApp reminder messages go out before each appointment. Export your full client and booking history to CSV at any time.",
      },
      {
        type: "feature" as const,
        icon: "grid-3x3-gap-fill",
        title: "Services & staff management",
        desc: "Add services with custom durations, prices, and booking rules. Assign staff, set their availability, and let clients choose who they book with.",
      },
    ],
  },
];

const filters: { id: FilterTag; label: string; icon: string }[] = [
  { id: "all", label: "All updates", icon: "grid-fill" },
  { id: "feature", label: "New features", icon: "stars" },
  { id: "improvement", label: "Improvements", icon: "arrow-up-circle-fill" },
  { id: "fix", label: "Bug fixes", icon: "bug-fill" },
];

export default function WhatsNewPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTag>("all");

  const visibleReleases = releases
    .map((r) => ({
      ...r,
      changes:
        activeFilter === "all"
          ? r.changes
          : r.changes.filter((c) => c.type === activeFilter),
    }))
    .filter((r) => r.changes.length > 0);

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-blue-50/40 to-white">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: "radial-gradient(circle, #bfdbfe 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Soft glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-primary/8 blur-3xl rounded-full" />

        <div className="relative max-w-4xl mx-auto px-6 public-page-offset pb-16">
          <FadeContainer>
            <FadeDiv>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3.5 py-1.5 text-xs font-medium text-primary shadow-sm mb-6">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </span>
                v1.5 now live — May 2026
              </div>
            </FadeDiv>

            <FadeDiv>
              <h1 className="font-cal text-5xl md:text-6xl tracking-tight text-gray-900 mb-4 leading-[1.05]">
                What&apos;s new in{" "}
                <span className="text-primary">Dinaya</span>
              </h1>
            </FadeDiv>

            <FadeDiv>
              <p className="text-lg text-gray-500 max-w-lg leading-relaxed">
                Every update, improvement, and fix — straight from the team
                building Dinaya for Sri Lankan businesses.
              </p>
            </FadeDiv>

            <FadeDiv>
              <div className="flex items-center gap-3 mt-8 flex-wrap">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                >
                  Get started free
                  <Icon name="arrow-right" className="text-xs" />
                </Link>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors px-2 py-2.5"
                >
                  Visit Help Centre
                  <Icon name="arrow-up-right" className="text-xs" />
                </Link>
              </div>
            </FadeDiv>
          </FadeContainer>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Filter chips */}
        <FadeContainer>
          <FadeDiv>
            <div className="flex items-center gap-2 flex-wrap mb-14">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeFilter === f.id
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-gray-100/80 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                  }`}
                >
                  <Icon name={f.icon} className="text-[11px]" />
                  {f.label}
                </button>
              ))}

              {/* Legend */}
              <div className="ml-auto hidden sm:flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  New
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
                  Improved
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  Fixed
                </span>
              </div>
            </div>
          </FadeDiv>
        </FadeContainer>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[7.75rem] top-4 bottom-8 w-px bg-gradient-to-b from-gray-200 via-gray-100 to-transparent hidden md:block" />

          <AnimatePresence mode="popLayout">
            {visibleReleases.map((release, i) => (
              <motion.div
                key={`${release.version}-${activeFilter}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.28, delay: i * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative mb-14 last:mb-4 md:grid md:grid-cols-[124px_1fr] md:gap-10"
              >
                {/* ── Date label (left col) ── */}
                <div className="mb-5 md:mb-0 md:pt-1">
                  <div className="md:text-right">
                    <div className="font-cal text-sm text-gray-800 tracking-tight leading-snug">
                      {release.date}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 md:justify-end flex-wrap">
                      <span
                        className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                          release.isLatest
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {release.version}
                      </span>
                      {release.isLatest && (
                        <span className="text-[10px] font-bold text-primary tracking-widest uppercase">
                          Latest
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Content (right col) ── */}
                <div className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[2.6rem] top-1.5 hidden md:block">
                    <div
                      className={`w-3 h-3 rounded-full border-2 border-white shadow ${
                        release.isLatest ? "bg-primary" : "bg-gray-300"
                      }`}
                    />
                  </div>

                  {/* Section title */}
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
                    {release.highlight}
                  </p>

                  {/* Change cards */}
                  <div className="space-y-2.5">
                    {release.changes.map((change, j) => {
                      const cfg = tagConfig[change.type];
                      return (
                        <div
                          key={j}
                          className="flex gap-3.5 p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-150"
                        >
                          {/* Type indicator stripe */}
                          <div
                            className={`flex-shrink-0 mt-0.5 w-1 self-stretch rounded-full ${cfg.dotClass} opacity-70`}
                          />

                          {/* Icon */}
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${cfg.iconBgClass}`}
                          >
                            <Icon name={change.icon} className="text-sm" />
                          </div>

                          {/* Text */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span
                                className={`inline-flex items-center text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${cfg.badgeClass}`}
                              >
                                {cfg.label}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {change.title}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">
                              {change.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty state */}
          <AnimatePresence>
            {visibleReleases.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="py-20 text-center text-gray-400"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Icon name="inbox" className="text-xl text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">Nothing here yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try a different filter to see updates.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Bottom CTA ───────────────────────────────────── */}
        <div className="mt-16 pt-10 border-t border-gray-100">
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Have a feature request?
              </p>
              <p className="text-sm text-gray-500">
                We build Dinaya based on what businesses actually need. Tell us
                what&apos;s missing.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href="/help"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 bg-white px-4 py-2.5 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <Icon name="chat-dots" className="text-xs" />
                Contact us
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
              >
                Get started free
                <Icon name="arrow-right" className="text-xs" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
