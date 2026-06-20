import dynamic from "next/dynamic";
import Link from "next/link";
import { LandingNav } from "@/components/LandingNav";
import { ProductMockupSkeleton } from "@/components/ProductMockupSkeleton";
import { CTAPrimaryButton } from "@/components/cta-primary-button";
import { LandingFooter } from "@/components/LandingFooter";
import { LandingIndustries } from "@/components/LandingIndustries";
import { Icon } from "@/components/ui/Icon";
import { BeforeAfterToggle } from "@/components/BeforeAfterToggle";
import { FeatureShowcase } from "@/components/FeatureShowcase";
import { LANDING_LIVE_DEMO_PATH } from "@/lib/landing-demo";

const HowItWorks = dynamic(() =>
  import("@/components/HowItWorks").then((m) => ({ default: m.HowItWorks }))
);

const ProductMockup = dynamic(() => import("@/components/ProductMockup"), {
  loading: () => <ProductMockupSkeleton />,
});

const testimonials = [
  {
    quote: "Dinaya completely replaced our WhatsApp booking system. Clients love being able to book and pay online. Our no-shows dropped overnight.",
    name: "Amal Perera",
    role: "Owner, Amal's Salon",
    location: "Colombo",
    initial: "A",
    color: "bg-blue-100 text-blue-700",
  },
  {
    quote: "I never thought managing appointments could be this simple. My patients book online and pay a deposit instantly — no more phone tag.",
    name: "Dr. Nisha Fernando",
    role: "NF Dental Clinic",
    location: "Kandy",
    initial: "N",
    color: "bg-violet-100 text-violet-700",
  },
  {
    quote: "My tuition class fills up without me managing WhatsApp groups. Parents just click the link and book their child's slot.",
    name: "Priya Wickramasinghe",
    role: "Piano Teacher",
    location: "Nugegoda",
    initial: "P",
    color: "bg-amber-100 text-amber-700",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white dark:bg-neutral-950">

      <LandingNav />

      <section className="max-w-4xl mx-auto px-6 public-page-offset-lg pb-12 text-center">
        <div className="flex flex-col items-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 rounded-full bg-white dark:bg-neutral-900 px-2.5 py-0.5 pr-3 pl-0.5 text-sm font-medium text-gray-900 dark:text-gray-100 ring-1 shadow-lg shadow-primary/10 ring-black/10 dark:ring-white/10">
              <span className="shrink-0 rounded-full border bg-gray-50 dark:bg-neutral-900/60 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-400">
                New
              </span>
              <span className="truncate">Free 14-day trial — no card needed</span>
            </div>
          </div>

          <h1 className="font-cal text-5xl tracking-tight mb-6 text-balance">
            Stop the{" "}
            <span className="text-primary">WhatsApp chaos.</span>
            <br />
            Get a real booking page in 5 minutes.
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
            Give your salon, clinic, or tuition class a booking page that works. Clients pick a time, pay online, and you get notified.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <CTAPrimaryButton>Create your booking page</CTAPrimaryButton>
            <Link
              href={LANDING_LIVE_DEMO_PATH}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-900/60 transition-colors"
            >
              <Icon name="box-arrow-up-right" className="text-base" />
              Try a live booking page
            </Link>
          </div>
        </div>
      </section>

      <div id="demo">
        <ProductMockup />
      </div>

      <section className="max-w-6xl mx-auto px-6 py-20 border-t">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <BeforeAfterToggle />
          <div>
            <span className="relative text-sm font-semibold tracking-tight text-primary">
              <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
              The difference
            </span>
            <h2 className="font-cal text-3xl md:text-4xl mt-3 tracking-tight text-balance">
              See what changes when you switch
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md text-pretty">
              Most Sri Lankan businesses still manage bookings over WhatsApp. Dinaya replaces all of that — automatically.
            </p>
            <ul className="mt-6 flex flex-col gap-2.5">
              {[
                "Bookings while you sleep",
                "Zero double bookings, ever",
                "Deposits collected upfront",
                "Reminders on autopilot",
              ].map((outcome) => (
                <li key={outcome} className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <Icon name="check-circle" className="shrink-0 text-base text-primary" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div id="feature-showcase">
        <FeatureShowcase />
      </div>

      <HowItWorks />

      <section className="max-w-6xl mx-auto px-6 py-16 border-t">
        <div className="text-center mb-12">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            Early access users
          </span>
          <h2 className="font-cal text-3xl md:text-4xl mt-3 tracking-tight">
            What businesses are saying
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-6 rounded-2xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Icon key={i} name="star-fill" className="text-xs text-amber-400" />
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 flex-1 mb-6 text-pretty">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className={`flex size-10 items-center justify-center rounded-full font-cal text-base shrink-0 ${t.color}`}>
                  {t.initial}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.role} · {t.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <LandingIndustries />

      <LandingFooter />
    </div>
  );
}
