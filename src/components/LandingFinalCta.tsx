import Link from "next/link";
import { CTAPrimaryButton } from "@/components/cta-primary-button";
import { MARKETING_CTA_HERO } from "@/lib/marketing-copy";

export function LandingFinalCta() {
  return (
    <section className="relative mx-auto max-w-4xl overflow-hidden px-6 py-20 text-center">
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-[radial-gradient(80%_70%_at_50%_0%,hsl(220_82%_53%/0.12),transparent_65%)] dark:bg-[radial-gradient(80%_70%_at_50%_0%,hsl(220_82%_53%/0.2),transparent_65%)]"
        aria-hidden="true"
      />
      <h2 className="font-cal text-3xl tracking-tight text-balance md:text-4xl">
        Your clients are already messaging you.
        <br />
        Give them a link that books.
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-muted-foreground text-pretty">
        Create your Dinaya booking page free for 14 days. No card required.
        Keep using WhatsApp — just stop managing every appointment in the chat.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <CTAPrimaryButton>{MARKETING_CTA_HERO}</CTAPrimaryButton>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          See pricing in LKR
        </Link>
      </div>
    </section>
  );
}
