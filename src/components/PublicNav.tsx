import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  Calendar, CreditCard, Bell, ArrowUpRight,
  ChevronDown, Scissors, Stethoscope, GraduationCap, Briefcase,
  BookOpen, HelpCircle, FileText, Sparkles,
} from "lucide-react";

export function PublicNav() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="relative max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Logo size="lg" />

        <div className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-700">
          {/* Features mega menu */}
          <div className="group">
            <button className="inline-flex items-center gap-1 px-3 py-2 rounded-md hover:text-gray-900 transition-colors">
              Features
              <ChevronDown className="size-3.5 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[920px] max-w-[calc(100vw-2rem)]">
              <div className="rounded-2xl border bg-white shadow-xl shadow-gray-900/[0.06] p-5 grid grid-cols-[260px_1fr_1fr_1fr] gap-5">
                {/* Promo card */}
                <Link
                  href="/register"
                  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 p-5 text-white flex flex-col justify-between min-h-[260px] hover:from-gray-900 transition-colors"
                >
                  <div>
                    <div className="text-[11px] font-mono tracking-wider text-primary/90 mb-2">DINAYA.LK</div>
                    <p className="font-cal text-lg leading-snug tracking-tight">
                      Don&apos;t juggle DMs,<br />just send a link.
                    </p>
                    <p className="text-xs text-white/60 mt-2 leading-relaxed">
                      Free for Sri Lankan businesses. Set up in five minutes.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4 decoration-primary">
                    Try now <ArrowUpRight className="size-3.5" />
                  </span>
                  <div className="pointer-events-none absolute -bottom-10 -right-10 size-32 rounded-full bg-primary/30 blur-3xl" />
                </Link>

                {/* Booking column */}
                <div className="rounded-xl ring-1 ring-emerald-100 bg-emerald-50/30 p-4">
                  <div className="flex items-center gap-2 pb-3 mb-2 border-b border-emerald-200/60">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-white">
                      <Calendar className="size-3.5" />
                    </span>
                    <span className="text-sm font-semibold text-gray-900">Booking</span>
                  </div>
                  <ul className="space-y-2.5 text-sm">
                    {["Self-booking page", "Custom availability", "Shareable link", "Buffer time", "Multi-staff calendar"].map((t) => (
                      <li key={t}>
                        <Link href="/#features" className="text-gray-600 hover:text-gray-900 transition-colors">{t}</Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Payments column */}
                <div className="rounded-xl ring-1 ring-sky-100 bg-sky-50/30 p-4">
                  <div className="flex items-center gap-2 pb-3 mb-2 border-b border-sky-200/60">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500 text-white">
                      <CreditCard className="size-3.5" />
                    </span>
                    <span className="text-sm font-semibold text-gray-900">Payments</span>
                  </div>
                  <ul className="space-y-2.5 text-sm">
                    {["PayHere checkout", "Deposit collection", "Full payment", "Refunds & cancellations", "Revenue tracking", "Invoice receipts"].map((t) => (
                      <li key={t}>
                        <Link href="/#features" className="text-gray-600 hover:text-gray-900 transition-colors">{t}</Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Engagement column */}
                <div className="rounded-xl ring-1 ring-pink-100 bg-pink-50/30 p-4">
                  <div className="flex items-center gap-2 pb-3 mb-2 border-b border-pink-200/60">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-pink-500 text-white">
                      <Bell className="size-3.5" />
                    </span>
                    <span className="text-sm font-semibold text-gray-900">Engagement</span>
                  </div>
                  <ul className="space-y-2.5 text-sm">
                    {["SMS reminders", "Email confirmations", "No-show protection", "Client dashboard", "Booking history", "Rebooking nudges"].map((t) => (
                      <li key={t}>
                        <Link href="/#features" className="text-gray-600 hover:text-gray-900 transition-colors">{t}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Solutions mega menu */}
          <div className="group">
            <button className="inline-flex items-center gap-1 px-3 py-2 rounded-md hover:text-gray-900 transition-colors">
              Solutions
              <ChevronDown className="size-3.5 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[680px] max-w-[calc(100vw-2rem)]">
              <div className="rounded-2xl border bg-white shadow-xl shadow-gray-900/[0.06] p-5 grid grid-cols-2 gap-2">
                {[
                  { icon: Scissors, color: "bg-rose-500", title: "Salons & spas", desc: "Stylists, beauty, wellness studios" },
                  { icon: Stethoscope, color: "bg-emerald-500", title: "Clinics", desc: "Dental, physio, doctors, vets" },
                  { icon: GraduationCap, color: "bg-indigo-500", title: "Tuition classes", desc: "Tutors, music, dance, art" },
                  { icon: Briefcase, color: "bg-amber-500", title: "Freelancers", desc: "Consultants, coaches, services" },
                ].map((it) => (
                  <Link key={it.title} href="/register" className="flex items-start gap-3 rounded-xl p-3 hover:bg-gray-50 transition-colors">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${it.color} text-white`}>
                      <it.icon className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">{it.title}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">{it.desc}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Resources mega menu */}
          <div className="group">
            <button className="inline-flex items-center gap-1 px-3 py-2 rounded-md hover:text-gray-900 transition-colors">
              Resources
              <ChevronDown className="size-3.5 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[680px] max-w-[calc(100vw-2rem)]">
              <div className="rounded-2xl border bg-white shadow-xl shadow-gray-900/[0.06] p-5 grid grid-cols-2 gap-2">
                {[
                  { icon: BookOpen, color: "bg-emerald-500", title: "Getting started", desc: "Set up your page in 5 minutes", href: "/register" },
                  { icon: HelpCircle, color: "bg-sky-500", title: "Help center", desc: "Answers to common questions", href: "#" },
                  { icon: Sparkles, color: "bg-pink-500", title: "What's new", desc: "Latest features and updates", href: "#" },
                  { icon: FileText, color: "bg-amber-500", title: "Legal", desc: "Terms, privacy, refund policy", href: "/legal/terms" },
                ].map((it) => (
                  <Link key={it.title} href={it.href} className="flex items-start gap-3 rounded-xl p-3 hover:bg-gray-50 transition-colors">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${it.color} text-white`}>
                      <it.icon className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">{it.title}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">{it.desc}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link href="/pricing" className="px-3 py-2 rounded-md hover:text-gray-900 transition-colors">
            Pricing
          </Link>
        </div>

        <div className="flex gap-4 items-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Get started free
          </Link>
        </div>
      </div>
    </nav>
  );
}
