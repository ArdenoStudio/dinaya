import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { PublicNav } from "@/components/PublicNav";
import { LandingFooter } from "@/components/LandingFooter";
import { DIRECTORY_CATEGORIES, categoryLabel, cityToSlug } from "@/lib/directory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover bookable businesses in Sri Lanka | Dinaya",
  description: "Find salons, clinics, tutors, and local services with online booking on Dinaya.lk.",
};

async function listDirectoryBusinesses(city?: string) {
  return db
    .select({
      name: businesses.name,
      slug: businesses.slug,
      description: businesses.description,
      directoryCity: businesses.directoryCity,
      directoryCategory: businesses.directoryCategory,
      logoUrl: businesses.logoUrl,
    })
    .from(businesses)
    .where(and(
      eq(businesses.directoryListed, true),
      eq(businesses.isSuspended, false),
      isNull(businesses.deletedAt),
      ...(city ? [eq(businesses.directoryCity, city)] : []),
    ))
    .orderBy(businesses.name);
}

export default async function DiscoverPage() {
  const listings = await listDirectoryBusinesses();
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <main className="min-h-screen bg-white">
      <PublicNav />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-gray-700">
            <i className="bi bi-compass text-primary" />
            Dinaya Directory
          </span>
          <h1 className="mt-4 font-cal text-4xl tracking-tight">Discover bookable businesses</h1>
          <p className="mt-3 text-muted-foreground">
            Browse Sri Lankan businesses with online booking pages. Listed businesses keep 100% of their earnings — Dinaya takes no commission.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <Link href="/discover" className="rounded-full border bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
            All cities
          </Link>
          {Array.from(new Set(listings.map((item) => item.directoryCity).filter(Boolean))).map((city) => (
            <Link
              key={city}
              href={`/discover/${cityToSlug(city!)}`}
              className="rounded-full border px-3 py-1.5 text-sm hover:border-primary/40"
            >
              {city}
            </Link>
          ))}
        </div>

        {listings.length === 0 ? (
          <div className="rounded-2xl border bg-gray-50 p-10 text-center">
            <p className="text-muted-foreground">No businesses are listed yet. Be the first to join from your dashboard marketing page.</p>
            <Link href="/register" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
              Create your booking page
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((business) => {
              const bookingUrl = appDomain === "dinaya.lk"
                ? `https://${business.slug}.dinaya.lk`
                : `${appUrl}/book/${business.slug}`;

              return (
                <Link
                  key={business.slug}
                  href={bookingUrl}
                  className="rounded-2xl border bg-white p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-cal text-xl tracking-tight">{business.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {business.directoryCity} · {categoryLabel(business.directoryCategory)}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                      Book online
                    </span>
                  </div>
                  {business.description ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">{business.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Online booking available on Dinaya.</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-12 rounded-2xl border bg-gray-50/70 p-6">
          <h2 className="font-cal text-2xl tracking-tight">Browse by category</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {DIRECTORY_CATEGORIES.map((category) => (
              <span key={category.value} className="rounded-full border bg-white px-3 py-1.5 text-sm">
                {category.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
