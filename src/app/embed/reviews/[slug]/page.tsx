import { notFound } from "next/navigation";
import { ReviewsWidget } from "@/components/booking/ReviewsWidget";
import { getPublicReviews } from "@/lib/reviews-public";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EmbedReviewsPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPublicReviews(slug, 8);

  if (!data) notFound();

  return (
    <main className="booking-page-bg min-h-screen p-4">
      <ReviewsWidget
        businessName={data.businessName}
        avgRating={data.avgRating}
        reviewCount={data.reviewCount}
        reviews={data.reviews}
        compact
      />
    </main>
  );
}
