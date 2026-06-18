import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/PublicNav";
import { LandingFooter } from "@/components/LandingFooter";
import { DiscoverListings } from "@/components/discover/DiscoverListings";
import {
  categoryLabel,
  isValidDirectoryCategory,
  listDirectoryBusinesses,
  slugToCity,
  type DirectoryCategory,
} from "@/lib/directory";

interface Props {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { city } = await params;
  const { category: rawCategory } = await searchParams;
  const resolved = slugToCity(city);
  if (!resolved) return {};
  const category = isValidDirectoryCategory(rawCategory) ? rawCategory : null;
  const categorySuffix = category ? ` · ${categoryLabel(category)}` : "";
  return {
    title: `Book businesses in ${resolved}${categorySuffix} | Dinaya Directory`,
    description: `Find bookable salons, clinics, tutors, and services in ${resolved}.`,
  };
}

export default async function DiscoverCityPage({ params, searchParams }: Props) {
  const { city: citySlug } = await params;
  const { category: rawCategory } = await searchParams;
  const city = slugToCity(citySlug);
  if (!city) notFound();

  const activeCategory: DirectoryCategory | null = isValidDirectoryCategory(rawCategory) ? rawCategory : null;
  const listings = await listDirectoryBusinesses({
    city,
    ...(activeCategory ? { category: activeCategory } : {}),
  });

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <PublicNav />

      <section className="mx-auto max-w-6xl px-6 public-page-offset pb-16">
        <Link href="/discover" className="text-sm text-primary hover:underline">← All cities</Link>
        <h1 className="mt-4 font-cal text-4xl tracking-tight">
          Book in {city}
          {activeCategory ? ` · ${categoryLabel(activeCategory)}` : ""}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {listings.length} business{listings.length === 1 ? "" : "es"} accepting online bookings.
        </p>

        <div className="mt-8">
          <DiscoverListings
            listings={listings}
            activeCategory={activeCategory}
            activeCity={city}
            showCityFilters={false}
          />
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
