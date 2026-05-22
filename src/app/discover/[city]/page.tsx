import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { PublicNav } from "@/components/PublicNav";
import { LandingFooter } from "@/components/LandingFooter";
import { categoryLabel, slugToCity } from "@/lib/directory";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ city: string }>;
}

function withDirectoryAttribution(url: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}channel=directory&utm_source=dinaya&utm_medium=directory`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const resolved = slugToCity(city);
  if (!resolved) return {};
  return {
    title: `Book businesses in ${resolved} | Dinaya Directory`,
    description: `Find bookable salons, clinics, tutors, and services in ${resolved}.`,
  };
}

export default async function DiscoverCityPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = slugToCity(citySlug);
  if (!city) notFound();

  const listings = await db
    .select({
      name: businesses.name,
      slug: businesses.slug,
      description: businesses.description,
      directoryCategory: businesses.directoryCategory,
    })
    .from(businesses)
    .where(and(
      eq(businesses.directoryListed, true),
      eq(businesses.directoryCity, city),
      eq(businesses.isSuspended, false),
      isNull(businesses.deletedAt),
    ))
    .orderBy(businesses.name);

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <main className="min-h-screen bg-white">
      <PublicNav />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <Link href="/discover" className="text-sm text-primary hover:underline">← All cities</Link>
        <h1 className="mt-4 font-cal text-4xl tracking-tight">Book in {city}</h1>
        <p className="mt-3 text-muted-foreground">
          {listings.length} business{listings.length === 1 ? "" : "es"} accepting online bookings.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((business) => {
            const bookingUrl = appDomain === "dinaya.lk"
              ? `https://${business.slug}.dinaya.lk`
              : `${appUrl}/book/${business.slug}`;
            const attributedBookingUrl = withDirectoryAttribution(bookingUrl);

            return (
              <Link
                key={business.slug}
                href={attributedBookingUrl}
                className="rounded-2xl border bg-white p-5 shadow-sm transition hover:border-primary/30"
              >
                <h2 className="font-cal text-xl tracking-tight">{business.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{categoryLabel(business.directoryCategory)}</p>
                {business.description ? (
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{business.description}</p>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
