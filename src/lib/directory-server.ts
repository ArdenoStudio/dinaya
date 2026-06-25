import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { type DirectoryCategory, type DirectoryListing, isPlaceholderListing } from "./directory";

export const listDirectoryBusinesses = unstable_cache(
  async (filters?: { city?: string; category?: DirectoryCategory }): Promise<DirectoryListing[]> => {
    try {
      const rows = await db
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
          ...(filters?.city ? [eq(businesses.directoryCity, filters.city)] : []),
          ...(filters?.category ? [eq(businesses.directoryCategory, filters.category)] : []),
        ))
        .orderBy(businesses.name);

      return rows.filter((row) => !isPlaceholderListing(row));
    } catch {
      return [];
    }
  },
  ["discover-listings"],
  { revalidate: 60 },
);
