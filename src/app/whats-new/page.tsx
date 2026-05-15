"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { FadeContainer, FadeDiv } from "@/components/Fade";
import { motion, AnimatePresence } from "motion/react";

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
    version: "v1.4",
    date: "May 2026",
    isLatest: true,
    highlight: "Multi-staff management & real-time scheduling",
    changes: [
      {
        type: "feature" as const,
        icon: "bi-people-fill",
        title: "Multi-staff booking",
        desc: "Clients can choose a preferred staff member when booking. Each staff member gets their own schedule, and all bookings roll up to your main dashboard.",
      },
      {
        type: "feature" as const,
        icon: "bi-calendar-event-fill",
        title: "Real-time calendar updates",
        desc: "Your dashboard calendar now reflects new bookings instantly — no more refreshing the page to see what just came in.",
      },
      {
        type: "improvement" as const,
        icon: "bi-lightning-charge-fill",
        title: "50% faster booking page load",
        desc: "Rebuilt the booking wizard with server-side rendering. First paint is now under 1.2 seconds on a mobile connection.",
      },
      {
        type: "fix" as const,
        icon: "bi-shield-fill-check",
        title: "Fixed double-booking race condition",
        desc: "Resolved a rare edge case where two clients could claim the same slot simultaneously during high-traffic periods.",
      },
    ],
  },
  {
    version: "v1.3",
    date: "March 2026",
    isLatest: false,
    highlight: "DoDo payments and SMS reminders",
    changes: [
      {
        type: "feature" as const,
        icon: "bi-credit-card-2-front-fill",
        title: "DoDo payment gateway",
        desc: "Accept payments through DoDo alongside PayHere. More options for your clients means fewer drop-offs at checkout.",
      },
      {
        type: "feature" as const,
        icon: "bi-chat-dots-fill",
        title: "SMS reminders via Dialog",
        desc: "Automated appointment reminders now send via SMS through Dialog Axiata — reaching clients who rarely check email.",
      },
      {
        type: "improvement" as const,
        icon: "bi-phone-fill",
        title: "Redesigned mobile booking wizard",
        desc: "Larger tap targets, a cleaner step layout, and a new progress bar make booking on mobile feel significantly smoother.",
      },
      {
        type: "improvement" as const,
        icon: "bi-alarm-fill",
        title: "Customisable reminder timing",
        desc: "Choose when reminders send — 24 hours, 2 hours, or 30 minutes before the appointment. Configure once and forget.",
      },
    ],
  },
  {
    version: "v1.2",
    date: "January 2026",
    isLatest: false,
    highlight: "Help Centre and cancellation policies",
    changes: [
      {
        type: "feature" as const,
        icon: "bi-question-circle-fill",
        title: "Help Centre launched",
        desc: "A searchable guide covering setup, payments, staff management, and troubleshooting — live at dinaya.lk/help.",
      },
      {
        type: "feature" as const,
        icon: "bi-x-circle-fill",
        title: "Custom cancellation policies",
        desc: "Set a cancellation window — 24h, 48h, or none at all. Clients see your policy before they confirm a booking.",
      },
      {
        type: "fix" as const,
        icon: "bi-clock-fill",
        title: "Timezone fix for Colombo",
        desc: "Late-night bookings occasionally appeared a day off in the dashboard due to a UTC conversion error. Resolved.",
      },
      {
        type: "fix" as const,
        icon: "bi-envelope-fill",
        title: "Confirmation emails hitting Gmail spam",
        desc: "Gmail was occasionally filtering our confirmation emails. Updated SPF and DKIM records — deliverability is back to normal.",
      },
    ],
  },
  {
    version: "v1.1",
    date: "November 2025",
    isLatest: false,
    highlight: "Revenue analytics and availability tools",
    changes: [
      {
        type: "feature" as const,
        icon: "bi-bar-chart-line-fill",
        title: "Revenue analytics dashboard",
        desc: "Total earnings, upcoming payments, refunds, and monthly trends — all visible from your main dashboard without any extra setup.",
      },
      {
        type: "improvement" as const,
        icon: "bi-send-fill",
        title: "Faster confirmation emails",
        desc: "Booking confirmations now arrive in under 3 seconds. Previously they could take up to 30 seconds during peak load.",
      },
      {
        type: "improvement" as const,
        icon: "bi-calendar-range-fill",
        title: "Date-range availability blocking",
        desc: "Block entire date ranges for holidays or leave. No more marking days off one at a time.",
      },
      {
        type: "fix" as const,
        icon: "bi-calendar-x-fill",
        title: "Availability conflict bug",
        desc: "Staff availability overlapping with business-wide blocked dates would sometimes still allow bookings. Now correctly prevented.",
      },
    ],
  },
  {
    version: "v1.0",
    date: "September 2025",
    isLatest: false,
    highlight: "Dinaya launches for Sri Lankan businesses",
    changes: [
      {
        type: "feature" as const,
        icon: "bi-rocket-takeoff-fill",
        title: "Dinaya is live",
        desc: "Online booking, PayHere payments, email reminders, and a clean dashboard — everything Sri Lankan service businesses need to stop managing appointments over WhatsApp.",
      },
      {
        type: "feature" as const,
        icon: "bi-link-45deg",
        title: "Your own booking page",
        desc: "Every business gets a dedicated page at yourname.dinaya.lk to share across WhatsApp, Instagram, and Facebook.",
      },
      {
        type: "feature" as const,
        icon: "bi-grid-3x3-gap-fill",
        title: "Service and pricing management",
        desc: "Add unlimited services with custom durations and prices. Clients see exactly what they're booking and what it costs.",
      },
    ],
  },
];

const filters: { id: FilterTag; label: string; icon: string }[] = [
  { id: "all", label: "All updates", icon: "bi-grid-fill" },
  { id: "feature", label: "New features", icon: "bi-stars" },
  { id: "improvement", label: "Improvements", icon: "bi-arrow-up-circle-fill" },
  { id: "fix", label: "Bug fixes", icon: "bi-bug-fill" },
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

        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-16">
          <FadeContainer>
            <FadeDiv>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3.5 py-1.5 text-xs font-medium text-primary shadow-sm mb-6">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </span>
                v1.4 now live — May 2026
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
                  <i className="bi bi-arrow-right text-xs" />
                </Link>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors px-2 py-2.5"
                >
                  Visit Help Centre
                  <i className="bi bi-arrow-up-right text-xs" />
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
                  <i className={`bi ${f.icon} text-[11px]`} />
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
                            <i className={`bi ${change.icon} text-sm`} />
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
                  <i className="bi bi-inbox text-xl text-gray-400" />
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
                <i className="bi bi-chat-dots text-xs" />
                Contact us
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
              >
                Get started free
                <i className="bi bi-arrow-right text-xs" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
