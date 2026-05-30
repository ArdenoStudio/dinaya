import type { Metadata } from "next";
import { PublicNav } from "@/components/PublicNav";
import { LandingFooter } from "@/components/LandingFooter";
import { DiscoverCityLinks, DiscoverListings } from "@/components/discover/DiscoverListings";
import { DiscoverDeals } from "@/components/discover/DiscoverDeals";
import {
  categoryLabel,
  isValidDirectoryCategory,
  listDirectoryBusinesses,
} from "@/lib/directory";
import { listActiveDeals } from "@/lib/deals/queries";
import { Icon } from "@/components/ui/Icon";

interface Props {
  searchParams: Promise<{ category?: string; city?: string; minDiscount?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category: rawCategory } = await searchParams;
  const category = isValidDirectoryCategory(rawCategory) ? rawCategory : null;
  if (!category) {
    return {
      title: "Discover bookable businesses in Sri Lanka | Dinaya",
      description: "Find salons, clinics, tutors, and local services with online booking on Dinaya.lk.",
    };
  }
  const label = categoryLabel(category);
  return {
    title: `${label} with online booking in Sri Lanka | Dinaya`,
    description: `Browse ${label.toLowerCase()} businesses accepting online bookings on Dinaya.lk.`,
  };
}

export default async function DiscoverPage({ searchParams }: Props) {
  const { category: rawCategory, city: rawCity, minDiscount: rawMinDiscount } = await searchParams;
  const activeCategory = isValidDirectoryCategory(rawCategory) ? rawCategory : null;
  const activeCity = rawCity?.trim() || null;
  const minDiscount = rawMinDiscount ? Number(rawMinDiscount) : undefined;

  const [allListings, activeDeals] = await Promise.all([
    listDirectoryBusinesses(),
    listActiveDeals({
      category: activeCategory ?? undefined,
      city: activeCity ?? undefined,
      minDiscount: Number.isFinite(minDiscount) ? minDiscount : undefined,
    }),
  ]);
  const listings = activeCategory
    ? await listDirectoryBusinesses({ category: activeCategory })
    : allListings;

  return (
    <main className="min-h-screen bg-white">
      <PublicNav />

      <section className="mx-auto max-w-6xl px-6 public-page-offset pb-16">
        <div className="mb-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-gray-700">
            <Icon name="compass" className="text-primary" />
            Dinaya Directory
          </span>
          <h1 className="mt-4 font-cal text-4xl tracking-tight">
            {activeCategory ? categoryLabel(activeCategory) : "Discover bookable businesses"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Browse Sri Lankan businesses with online booking pages. Listed businesses keep 100% of their earnings — Dinaya takes no commission.
          </p>
        </div>

        <DiscoverCityLinks listings={allListings} activeCategory={activeCategory} />

        <DiscoverDeals deals={activeDeals} activeCity={activeCity} minDiscount={minDiscount} />

        <div className="mb-8">
          <h2 className="font-cal text-2xl tracking-tight">Browse businesses</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All listed businesses with online booking on Dinaya.
          </p>
        </div>

        <DiscoverListings
          listings={listings}
          activeCategory={activeCategory}
          showCityFilters={false}
        />
      </section>

      <LandingFooter />
    </main>
  );
}
