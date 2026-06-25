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

const FILTER_PILL_ACTIVE =
  "border-primary/30 bg-primary/5 font-medium text-primary";
const FILTER_PILL_INACTIVE =
  "border-gray-200 bg-white text-gray-700 hover:border-primary/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-300";

export function DiscoverListings({ listings, activeCategory, activeCity, showCityFilters = true }: Props) {
  const cities = Array.from(new Set(listings.map((item) => item.directoryCity).filter(Boolean))) as string[];

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={discoverFilterHref({ city: activeCity ?? undefined, category: null })}
          className={`rounded-full border px-3 py-1.5 text-sm ${
            !activeCategory ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE
          }`}
        >
          All categories
        </Link>
        {DIRECTORY_CATEGORIES.map((category) => (
          <Link
            key={category.value}
            href={discoverFilterHref({ city: activeCity ?? undefined, category: category.value })}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              activeCategory === category.value ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE
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
            className={`rounded-full border px-3 py-1.5 text-sm ${
              !activeCity ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE
            }`}
          >
            All cities
          </Link>
          {cities.map((city) => (
            <Link
              key={city}
              href={discoverFilterHref({ city, category: activeCategory ?? undefined })}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                activeCity === city ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE
              }`}
            >
              {city}
            </Link>
          ))}
        </div>
      ) : null}

      {listings.length === 0 ? (
        <div className="rounded-2xl border bg-gray-50 dark:bg-neutral-900/60 p-10 text-center">
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
                className="rounded-2xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5 shadow-sm transition-[transform,box-shadow,border-color] duration-150 ease-out hover:border-primary/30 hover:shadow-md active:scale-[0.99] motion-reduce:active:scale-100"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {business.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={business.logoUrl}
                        alt=""
                        className="size-10 shrink-0 rounded-lg object-cover image-depth"
                      />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-gray-50 dark:bg-neutral-900/60 text-xs font-semibold text-primary">
                        {business.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 font-cal text-xl tracking-tight text-balance">{business.name}</h2>
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
                  <p className="line-clamp-3 text-sm text-pretty text-muted-foreground">{business.description}</p>
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
      <Link
        href={discoverFilterHref({ category: activeCategory ?? undefined })}
        className={`rounded-full border px-3 py-1.5 text-sm ${FILTER_PILL_ACTIVE}`}
      >
        All cities
      </Link>
      {cities.map((city) => (
        <Link
          key={city}
          href={discoverFilterHref({ city, category: activeCategory ?? undefined })}
          className={`rounded-full border px-3 py-1.5 text-sm ${FILTER_PILL_INACTIVE}`}
        >
          {city}
        </Link>
      ))}
    </div>
  );
}
