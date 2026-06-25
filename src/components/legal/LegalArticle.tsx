import Link from "next/link";

const LEGAL_PAGES = [
  { label: "Privacy Policy", href: "/legal/privacy", slug: "privacy" },
  { label: "Terms of Service", href: "/legal/terms", slug: "terms" },
  { label: "Refund Policy", href: "/legal/refund", slug: "refund" },
] as const;

type LegalPageSlug = (typeof LEGAL_PAGES)[number]["slug"];

interface LegalArticleProps {
  title: string;
  current: LegalPageSlug;
  children: React.ReactNode;
}

export function LegalArticle({ title, current, children }: LegalArticleProps) {
  const otherPages = LEGAL_PAGES.filter((page) => page.slug !== current);

  return (
    <article
      className={[
        "max-w-none text-base leading-relaxed text-gray-700 dark:text-gray-300",
        "[&_h1]:font-cal [&_h1]:text-3xl [&_h1]:tracking-tight [&_h1]:text-gray-900 dark:text-gray-100 [&_h1]:mb-2",
        "[&_h2]:font-cal [&_h2]:text-lg [&_h2]:tracking-tight [&_h2]:text-gray-900 dark:text-gray-100 [&_h2]:mt-10 [&_h2]:mb-3",
        "[&_p]:mb-4 [&_p:last-child]:mb-0",
        "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5",
        "[&_li]:text-gray-700 dark:text-gray-300",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80",
        "[&_strong]:font-semibold [&_strong]:text-gray-900 dark:text-gray-100",
      ].join(" ")}
    >
      <h1>{title}</h1>
      <p className="text-muted-foreground mb-8">Last updated: May 2026</p>

      <nav
        aria-label="Other legal pages"
        className="mb-10 flex flex-wrap gap-x-4 gap-y-2 rounded-xl border bg-gray-50 dark:bg-neutral-900/60 px-4 py-3 text-xs"
      >
        {otherPages.map((page) => (
          <Link key={page.href} href={page.href} className="font-medium no-underline hover:underline">
            {page.label}
          </Link>
        ))}
      </nav>

      {children}
    </article>
  );
}

export function LegalContact() {
  return (
    <>
      email us at <a href="mailto:hello@dinaya.lk">hello@dinaya.lk</a>
    </>
  );
}
