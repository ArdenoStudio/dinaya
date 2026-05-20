"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="relative max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Logo size="lg" />

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-700">
          {/* Features mega menu */}
          <div className="group">
            <button className="inline-flex items-center gap-1 px-3 py-2 rounded-md hover:text-gray-900 transition-colors">
              Features
              <i className="bi bi-chevron-down text-xs text-gray-400 group-hover:text-gray-600 transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[920px] max-w-[calc(100vw-2rem)]">
              <div className="rounded-2xl border bg-white shadow-xl shadow-gray-900/[0.06] p-5 grid grid-cols-[260px_1fr_1fr_1fr] gap-5">
                {/* Promo card */}
                <Link
                  href="/register"
                  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 p-5 text-white flex flex-col justify-between min-h-[260px]"
                >
                  <div>
                    <p className="font-cal text-lg leading-snug tracking-tight">
                      Don&apos;t juggle DMs,<br />just send a link.
                    </p>
                    <p className="text-xs text-white/60 mt-2 leading-relaxed">
                      Free for Sri Lankan businesses. Set up in five minutes.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4 decoration-primary">
                    Try now <i className="bi bi-arrow-up-right text-xs" />
                  </span>
                  <div className="pointer-events-none absolute -bottom-10 -right-10 size-32 rounded-full bg-primary/30 blur-3xl" />
                </Link>

                {/* Booking column */}
                <div className="rounded-xl ring-1 ring-amber-100 bg-amber-50/30 p-4">
                  <Link href="/features#booking" className="flex items-center gap-2 pb-3 mb-2 border-b border-amber-200/60 hover:opacity-80 transition-opacity">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500 text-white">
                      <i className="bi bi-calendar text-xs" />
                    </span>
                    <span className="text-sm font-semibold text-gray-900">Booking</span>
                  </Link>
                  <ul className="space-y-2.5 text-sm">
                    {["Self-booking page", "Custom availability", "Shareable link", "Buffer time", "Multi-staff calendar"].map((t) => (
                      <li key={t}>
                        <Link href="/features#booking" className="text-gray-600 hover:text-gray-900 transition-colors">{t}</Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Payments column */}
                <div className="rounded-xl ring-1 ring-blue-100 bg-blue-50/30 p-4">
                  <Link href="/features#payments" className="flex items-center gap-2 pb-3 mb-2 border-b border-blue-200/60 hover:opacity-80 transition-opacity">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white">
                      <i className="bi bi-credit-card text-xs" />
                    </span>
                    <span className="text-sm font-semibold text-gray-900">Payments</span>
                  </Link>
                  <ul className="space-y-2.5 text-sm">
                    {["PayHere checkout", "Deposit collection", "Full payment", "Refunds & cancellations", "Revenue tracking", "Invoice receipts"].map((t) => (
                      <li key={t}>
                        <Link href="/features#payments" className="text-gray-600 hover:text-gray-900 transition-colors">{t}</Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Engagement column */}
                <div className="rounded-xl ring-1 ring-violet-100 bg-violet-50/30 p-4">
                  <Link href="/features#engagement" className="flex items-center gap-2 pb-3 mb-2 border-b border-violet-200/60 hover:opacity-80 transition-opacity">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500 text-white">
                      <i className="bi bi-bell text-xs" />
                    </span>
                    <span className="text-sm font-semibold text-gray-900">Engagement</span>
                  </Link>
                  <ul className="space-y-2.5 text-sm">
                    {["SMS reminders", "Email confirmations", "No-show protection", "Client dashboard", "Booking history", "Rebooking nudges"].map((t) => (
                      <li key={t}>
                        <Link href="/features#engagement" className="text-gray-600 hover:text-gray-900 transition-colors">{t}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Link href="/pricing" className="px-3 py-2 rounded-md hover:text-gray-900 transition-colors">
            Pricing
          </Link>

          <Link href="/help" className="px-3 py-2 rounded-md hover:text-gray-900 transition-colors">
            Help
          </Link>
        </div>

        {/* Right: auth + hamburger */}
        <div className="flex gap-3 items-center">
          <Link
            href="/login"
            className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Get started free
          </Link>
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <i className={`bi ${mobileOpen ? "bi-x-lg" : "bi-list"} text-lg`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="max-w-6xl mx-auto px-6 py-4 space-y-1">
            <Link
              href="/features"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <i className="bi bi-grid text-gray-400 text-base w-4" />
              Features
            </Link>
            <Link
              href="/solutions"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <i className="bi bi-lightning text-gray-400 text-base w-4" />
              Solutions
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <i className="bi bi-tag text-gray-400 text-base w-4" />
              Pricing
            </Link>
            <Link
              href="/help"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <i className="bi bi-question-circle text-gray-400 text-base w-4" />
              Help center
            </Link>
            <Link
              href="/whats-new"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <i className="bi bi-stars text-gray-400 text-base w-4" />
              What&apos;s new
            </Link>

            <div className="pt-3 mt-2 border-t grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center px-4 py-2.5 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
