import type { Metadata } from "next";
import Link from "next/link";
import { FadeContainer, FadeDiv, FadeSpan } from "@/components/Fade";
import { PublicNav } from "@/components/PublicNav";
import { CTAPrimaryButton } from "@/components/cta-primary-button";
import { LandingFooter } from "@/components/LandingFooter";
import { auth } from "@/auth";
import { annualSavingsPercent, getPlanConfigAsync } from "@/lib/plan";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Pricing — Free for Every Sri Lankan Business | Dinaya",
  description:
    "Dinaya is free for all Sri Lankan businesses. No credit card, no hidden fees. Create your booking page and start accepting appointments today.",
};

const freeFeatures = [
  "Your own booking page at yourname.dinaya.lk",
  "Unlimited bookings, every month",
  "Online payments via PayHere when you connect your merchant account",
  "Automated email appointment reminders",
  "Custom availability & buffer time",
  "Simple dashboard for all your bookings",
  "Shareable link for Instagram, WhatsApp, Facebook",
  "Free updates forever",
];

const proOperationalFeatures = [
  "Everything in Free",
  "AI Booking Autopilot",
  "Smart reminder system",
  "Review engine",
  "Client Reactivation Campaign",
  "AI upsell assistant",
  "30-Day AI Content Machine",
  "VIP Loyalty Sequence",
  "Multi-staff calendar & permissions",
  "Custom domain (e.g. book.yoursalon.lk)",
  "Remove Dinaya branding",
  "Advanced reports & exports",
  "Priority WhatsApp support",
];

const maxAiFeatures = [
  "Everything in Pro",
  "Unlimited branch locations",
  "Per-branch AI workflow controls",
  "Priority rollout support for multi-branch teams",
];

const faqs = [
  {
    q: "Is Dinaya really free?",
    a: "Yes. Every Sri Lankan business can use the Free plan with no time limit and no card required. PayHere and WhatsApp/SMS reminders unlock on Pro when you're ready to upgrade.",
  },
  {
    q: "Are there transaction fees?",
    a: "Free includes email confirmations and a 24-hour email reminder. Pro adds SMS and WhatsApp reminders, plus AI-timed smart reminders. PayHere card fees (typically 3.3% + LKR 30) are charged by PayHere directly — Dinaya does not add a commission.",
  },
  {
    q: "Is Pro available?",
    a: "Yes — Pro and Max are available now. Start on Free and upgrade anytime from your dashboard billing page when you're ready for multi-staff tools, AI growth features, or unlimited branches.",
  },
  {
    q: "Can I switch plans later?",
    a: "Anytime — and you'll never lose your bookings, link, or history. Free works forever for solo businesses; you only need Pro if you want multi-staff, branding control, or a custom domain.",
  },
  {
    q: "Do you offer refunds?",
    a: "Free is free, so there's nothing to refund. For paid add-ons, see our refund policy — we issue refunds for any unused billing period within 14 days.",
  },
];

export default async function PricingPage() {
  const session = await auth();
  const upgradeHref = session?.user ? "/dashboard/billing" : "/register";
  const upgradeLabel = session?.user ? "Upgrade in dashboard" : "Get started";
  const config = await getPlanConfigAsync();
  const proAnnualSavings = annualSavingsPercent(config.proMonthlyPriceLkr, config.proAnnualPriceLkr);
  const maxAnnualSavings = annualSavingsPercent(config.maxMonthlyPriceLkr, config.maxAnnualPriceLkr);
  return (
    <main className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-10 text-center">
        <FadeContainer className="flex flex-col items-center">
          <FadeDiv className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
              <Icon name="stars" className="text-xs text-primary" />
              Free for every Sri Lankan business
            </span>
          </FadeDiv>

          <h1 className="font-cal text-5xl tracking-tight mb-5">
            <FadeSpan>Simple pricing.</FadeSpan>{" "}
            <FadeSpan className="text-primary">No surprises.</FadeSpan>
          </h1>

          <FadeDiv>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Start free, keep it free. Upgrade only when you outgrow it — never because we made you.
            </p>
          </FadeDiv>
        </FadeContainer>
      </section>

      {/* Plans — equal card widths with even spacing; Pro centered in the row */}
      <section className="px-6 pb-20">
        <div className="flex justify-center">
          <div className="inline-flex w-full max-w-[96rem] flex-col items-stretch gap-5 sm:gap-6 lg:w-auto lg:flex-row lg:items-stretch">
          {/* Free plan */}
          <div className="relative flex w-full max-w-[calc((64rem-1.25rem)/2)] shrink-0 flex-col rounded-2xl border bg-white p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-cal text-2xl tracking-tight">Free</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-700 ring-1 ring-violet-200 px-2 py-0.5 text-[11px] font-medium">
                <Icon name="lightning-charge" />
                Current
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Everything a solo business needs to ditch WhatsApp booking.
            </p>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="font-cal text-5xl tracking-tight">LKR 0</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Free forever. No credit card.</p>
            </div>

            <CTAPrimaryButton size="md" className="mb-7">Create your booking page</CTAPrimaryButton>

            <ul className="space-y-3 text-sm">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <Icon name="check" className="text-primary" style={{ fontSize: '0.625rem' }} />
                  </span>
                  <span className="text-gray-700">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro plan */}
          <div className="relative z-10 flex w-full max-w-[calc((64rem-1.25rem)/2)] shrink-0 flex-col overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50 to-blue-100 p-8 shadow-xl shadow-blue-200/60">
            <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-blue-300/30 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-cal text-2xl tracking-tight">Pro</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                For growing teams — up to 3 branches, all seven AI growth tools, and advanced operations.
              </p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-cal text-5xl tracking-tight">LKR {config.proMonthlyPriceLkr.toLocaleString("en-LK")}</span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  or LKR {config.proAnnualPriceLkr.toLocaleString("en-LK")}/year
                  {proAnnualSavings > 0 && (
                    <span className="ml-1 text-emerald-600">· save {proAnnualSavings}%</span>
                  )}
                </p>
              </div>

              <Link
                href={upgradeHref}
                className="inline-flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors mb-7"
              >
                {upgradeLabel}
                <Icon name="arrow-right" className="text-sm" />
              </Link>

              <ul className="space-y-3 text-sm">
                {proOperationalFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <Icon name="check" className="text-primary" style={{ fontSize: '0.625rem' }} />
                    </span>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>

            </div>
          </div>

          {/* Max plan */}
          <div className="relative flex w-full max-w-[calc((64rem-1.25rem)/2)] shrink-0 flex-col overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-white via-yellow-50 to-amber-100 p-8 shadow-xl shadow-amber-200/60">
            <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-amber-200/50 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-cal text-2xl tracking-tight">Max</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Everything in Pro — plus unlimited branches for larger teams.
              </p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-cal text-5xl tracking-tight">LKR {config.maxMonthlyPriceLkr.toLocaleString("en-LK")}</span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  or LKR {config.maxAnnualPriceLkr.toLocaleString("en-LK")}/year
                  {maxAnnualSavings > 0 && (
                    <span className="ml-1 text-emerald-600">· save {maxAnnualSavings}%</span>
                  )}
                </p>
              </div>

              <Link
                href={upgradeHref}
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors mb-7"
              >
                {upgradeLabel}
                <Icon name="arrow-right" className="text-sm" />
              </Link>

              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Multi-branch scale
              </p>
              <ul className="space-y-3 text-sm">
                {maxAiFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400/25">
                      <Icon name="check" className="text-amber-600" style={{ fontSize: '0.625rem' }} />
                    </span>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-5xl">
        {/* Value strip */}
        <div className="grid sm:grid-cols-3 gap-px bg-gray-200/70 rounded-2xl overflow-hidden border border-gray-200/70">
          {[
            { icon: "shield-check", title: "No commissions", desc: "Keep 100% of every booking — we don't take a cut." },
            { icon: "credit-card", title: "No setup fees", desc: "Create your page and go live in 5 minutes." },
            { icon: "chat-square-text", title: "Real human support", desc: "We reply on WhatsApp in Sinhala, Tamil, or English." },
          ].map((it) => (
            <div key={it.title} className="bg-white p-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/15 mb-3">
                <Icon name={it.icon} className="text-sm text-primary" />
              </div>
              <h4 className="font-cal text-base mb-1 tracking-tight">{it.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* Compare table */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            Compare plans
          </span>
          <h2 className="font-cal text-3xl mt-3 tracking-tight">What&apos;s included where</h2>
        </div>

        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/70">
              <tr>
                <th className="text-left font-medium text-gray-600 px-5 py-3 w-1/2">Feature</th>
                <th className="text-center font-medium text-gray-600 px-5 py-3">Free</th>
                <th className="text-center font-medium text-gray-600 px-5 py-3">Pro</th>
                <th className="text-center font-medium text-gray-600 px-5 py-3">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { f: "Self-booking page", a: "Yes", b: "Yes", icon: "calendar", c: "Yes" },
                { f: "Online payments (PayHere)", a: "Yes", b: "Yes", icon: "credit-card", c: "Yes" },
                { f: "SMS + email reminders", a: "Email", b: "Yes", icon: "bell", c: "Yes" },
                { f: "Booking dashboard", a: "Yes", b: "Yes", icon: "grid", c: "Yes" },
                { f: "Multi-staff calendar", a: "—", b: "Yes", icon: "people", c: "Yes" },
                { f: "Branch locations", a: "1", b: "Up to 3", icon: "geo-alt", c: "Unlimited" },
                { f: "Custom domain", a: "—", b: "Yes", icon: "globe", c: "Yes" },
                { f: "Remove Dinaya branding", a: "—", b: "Yes", icon: "eye-slash", c: "Yes" },
                { f: "Advanced reports & exports", a: "—", b: "Yes", icon: "bar-chart", c: "Yes" },
                { f: "Priority support", a: "Email", b: "WhatsApp", icon: "headset", c: "WhatsApp" },
                { f: "AI Booking Autopilot", a: "—", b: "Yes", icon: "robot", c: "Yes" },
                { f: "Smart reminder system", a: "—", b: "Yes", icon: "bell-fill", c: "Yes" },
                { f: "Review engine", a: "—", b: "Yes", icon: "star", c: "Yes" },
                { f: "Client Reactivation Campaign", a: "—", b: "Yes", icon: "arrow-repeat", c: "Yes" },
                { f: "AI upsell assistant", a: "—", b: "Yes", icon: "graph-up-arrow", c: "Yes" },
                { f: "30-Day AI Content Machine", a: "—", b: "Yes", icon: "calendar3", c: "Yes" },
                { f: "VIP Loyalty Sequence", a: "—", b: "Yes", icon: "gem", c: "Yes" },
              ].map((row) => (
                <tr key={row.f} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-800">
                    <span className="inline-flex items-center gap-2.5">
                      {row.icon ? <Icon name={row.icon} className="text-xs text-gray-400" /> : <span className="w-3.5 h-3.5 inline-block" />}
                      {row.f}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {row.a === "Yes" ? (
                      <Icon name="check" className="text-sm text-primary" />
                    ) : (
                      <span className="text-gray-700">{row.a}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {row.b === "Yes" ? (
                      <Icon name="check" className="text-sm text-primary" />
                    ) : (
                      <span className="text-gray-700">{row.b}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {row.c === "Yes" ? (
                      <Icon name="check" className="text-sm text-primary" />
                    ) : (
                      <span className="text-gray-700">{row.c}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            FAQ
          </span>
          <h2 className="font-cal text-3xl mt-3 tracking-tight">Questions, answered</h2>
        </div>

        <div className="divide-y border-y">
          {faqs.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer items-start justify-between gap-4 list-none">
                <span className="font-cal text-base tracking-tight text-gray-900">{item.q}</span>
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-gray-500 group-open:bg-primary group-open:text-white group-open:border-primary transition-colors">
                  <svg
                    className="size-3 group-open:rotate-45 transition-transform"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3 pr-10">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-8 py-16 text-center shadow-2xl shadow-blue-500/20">
            {/* Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="pricing-cta-pattern" patternUnits="userSpaceOnUse" width="64" height="64">
                    {Array.from({ length: 17 }, (_, i) => {
                      const offset = i * 8;
                      return (
                        <path
                          key={i}
                          d={`M${-106 + offset} 110L${22 + offset} -18`}
                          stroke="white"
                          strokeWidth="1"
                        />
                      );
                    })}
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#pricing-cta-pattern)" />
              </svg>
            </div>
            <div className="relative z-10">
              <h2 className="font-cal text-3xl md:text-4xl tracking-tight text-white mb-3">
                Start free. Grow at your pace.
              </h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                Your booking page goes live in five minutes. No card, no commitment.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-7 py-3.5 rounded-xl font-semibold shadow-lg hover:bg-white/95 transition-colors"
              >
                Create your page
                <Icon name="arrow-right" className="text-sm" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
