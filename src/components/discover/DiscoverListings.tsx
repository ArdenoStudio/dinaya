import Link from "next/link";
import {
  DIRECTORY_CATEGORIES,
  buildDirectoryBookingUrl,
  categoryLabel,
  discoverFilterHref,
  type DirectoryCategory,
  type DirectoryListing,
} from "@/lib/directory";

type Props = {
  listings: DirectoryListing[];
  activeCategory?: DirectoryCategory | null;
  activeCity?: string | null;
  showCityFilters?: boolean;
};

export function DiscoverListings({ listings, activeCategory, activeCity, showCityFilters = true }: Props) {
  const cities = Array.from(new Set(listings.map((item) => item.directoryCity).filter(Boolean))) as string[];

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={discoverFilterHref({ city: activeCity ?? undefined, category: null })}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
            !activeCategory ? "bg-primary/5 text-primary" : "hover:border-primary/40"
          }`}
        >
          All categories
        </Link>
        {DIRECTORY_CATEGORIES.map((category) => (
          <Link
            key={category.value}
            href={discoverFilterHref({ city: activeCity ?? undefined, category: category.value })}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              activeCategory === category.value
                ? "bg-primary/5 font-medium text-primary"
                : "bg-white hover:border-primary/40"
            }`}
          >
            {category.label}
          </Link>
        ))}
      </div>

      {showCityFilters && cities.length > 0 ? (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href={discoverFilterHref({ category: activeCategory ?? undefined })}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              !activeCity ? "bg-primary/5 text-primary" : "hover:border-primary/40"
            }`}
          >
            All cities
          </Link>
          {cities.map((city) => (
            <Link
              key={city}
              href={discoverFilterHref({ city, category: activeCategory ?? undefined })}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                activeCity === city ? "bg-primary/5 font-medium text-primary" : "hover:border-primary/40"
              }`}
            >
              {city}
            </Link>
          ))}
        </div>
      ) : null}

      {listings.length === 0 ? (
        <div className="rounded-2xl border bg-gray-50 p-10 text-center">
          <p className="text-muted-foreground">No businesses match these filters yet.</p>
          <Link href="/register" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
            Create your booking page
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((business) => {
            const bookingUrl = buildDirectoryBookingUrl(business.slug);
            return (
              <Link
                key={business.slug}
                href={bookingUrl}
                className="rounded-2xl border bg-white p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {business.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={business.logoUrl}
                        alt=""
                        className="size-10 shrink-0 rounded-lg border object-cover"
                      />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-gray-50 text-xs font-semibold text-primary">
                        {business.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 font-cal text-xl tracking-tight">{business.name}</h2>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {business.directoryCity ?? "Sri Lanka"} · {categoryLabel(business.directoryCategory)}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 self-start whitespace-nowrap rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
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
    </>
  );
}

export function DiscoverCityLinks({ listings, activeCategory }: { listings: DirectoryListing[]; activeCategory?: DirectoryCategory | null }) {
  const cities = Array.from(new Set(listings.map((item) => item.directoryCity).filter(Boolean))) as string[];
  if (cities.length === 0) return null;

  return (
    <div className="mb-8 flex flex-wrap gap-2">
      <Link href={discoverFilterHref({ category: activeCategory ?? undefined })} className="rounded-full border bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
        All cities
      </Link>
      {cities.map((city) => (
        <Link
          key={city}
          href={discoverFilterHref({ city, category: activeCategory ?? undefined })}
          className="rounded-full border px-3 py-1.5 text-sm hover:border-primary/40"
        >
          {city}
        </Link>
      ))}
    </div>
  );
}
