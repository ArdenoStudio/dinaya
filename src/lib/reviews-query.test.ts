import { describe, expect, it } from "vitest";
import { parsePublicReviewsQuery } from "@/lib/reviews-query";

describe("public reviews query parsing", () => {
  it("accepts bounded integer pagination and star filters", () => {
    expect(
      parsePublicReviewsQuery(
        new URLSearchParams({ page: "3", limit: "25", rating: "4" }),
      ),
    ).toEqual({ page: 3, limit: 25, offset: 50, rating: 4 });
  });

  it.each([
    { page: "1.5" },
    { page: "Infinity" },
    { page: "501" },
    { limit: "51" },
    { rating: "0" },
    { rating: "6" },
  ])("rejects abusive or malformed values: %o", (query) => {
    expect(parsePublicReviewsQuery(new URLSearchParams(query))).toBeNull();
  });
});
