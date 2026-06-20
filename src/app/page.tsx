import dynamic from "next/dynamic";
import Link from "next/link";
import { LandingNav } from "@/components/LandingNav";
import { ProductMockupSkeleton } from "@/components/ProductMockupSkeleton";
import { CTAPrimaryButton } from "@/components/cta-primary-button";
import { LandingFooter } from "@/components/LandingFooter";
import { LandingIndustries } from "@/components/LandingIndustries";
import { Icon } from "@/components/ui/Icon";
import { TextAnimate } from "@/components/ui/text-animate";
import { BeforeAfterToggle } from "@/components/BeforeAfterToggle";
import { FeatureShowcase } from "@/components/FeatureShowcase";

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
            <Link
              href="/register"
              className="inline-flex items-center gap-3 rounded-full bg-white dark:bg-neutral-900 px-2.5 py-0.5 pr-3 pl-0.5 text-sm font-medium text-gray-900 dark:text-gray-100 ring-1 shadow-lg shadow-primary/10 ring-black/10 dark:ring-white/10 transition-colors hover:bg-primary/5"
            >
              <span className="shrink-0 rounded-full border bg-gray-50 dark:bg-neutral-900/60 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-400">
                New
              </span>
              <span className="flex items-center gap-1 truncate">
                Free 14-day trial — no card needed
                <Icon name="arrow-up-right" className="text-xs shrink-0 text-gray-700 dark:text-gray-300" />
              </span>
            </Link>
          </div>

          <h1 className="font-cal text-5xl tracking-tight mb-6 text-balance">
            Stop the{" "}
            <span className="text-primary">WhatsApp chaos.</span>
            <br />
            Get a real booking page in 5 minutes.
          </h1>

          <TextAnimate
            animation="fadeIn"
            by="word"
            as="p"
            startOnView={false}
            className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty"
          >
            Give your salon, clinic, or tuition class a booking page that works. Clients pick a time, pay online, and you get notified.
          </TextAnimate>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <CTAPrimaryButton>Create your booking page</CTAPrimaryButton>
            <Link
              href="#demo"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-900/60 transition-colors"
            >
              <Icon name="play-circle" className="text-base" />
              See a live demo
            </Link>
          </div>
        </div>
      </section>

      <div id="demo">
        <ProductMockup />
      </div>

      <section className="max-w-6xl mx-auto px-6 py-6 border-t">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
          {[
            { icon: "geo-alt-fill", text: "Built exclusively for Sri Lanka" },
            { icon: "currency-dollar", text: "No USD subscriptions" },
            { icon: "percent", text: "Zero commission on bookings" },
            { icon: "whatsapp", text: "Replace WhatsApp chaos for good" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5">
              <Icon name={item.icon} className="text-primary text-xs" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

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
            <div className="mt-7">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Create your booking page
                <Icon name="arrow-right" className="text-xs" />
              </Link>
            </div>
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
          <TextAnimate
            animation="fadeIn"
            by="word"
            as="h2"
            className="font-cal text-3xl md:text-4xl mt-3 tracking-tight"
          >
            What businesses are saying
          </TextAnimate>
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

      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border border-border bg-card px-8 py-16 text-center shadow-sm">
            <TextAnimate
              animation="fadeIn"
              by="word"
              as="h2"
              className="font-cal text-3xl md:text-4xl tracking-tight text-foreground mb-3"
            >
              Ready to go bookable?
            </TextAnimate>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
              Set up your booking page in 5 minutes. Start accepting clients today.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <CTAPrimaryButton size="md">Create your booking page</CTAPrimaryButton>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
