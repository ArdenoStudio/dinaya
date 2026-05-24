import { notFound } from "next/navigation";
import { verifyReviewToken } from "@/lib/ai/review-links";
import { ReviewForm } from "./ReviewForm";

export default async function SignedReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = verifyReviewToken(token);
  if (!payload) notFound();

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-12">
      <div className="mx-auto max-w-md">
        <ReviewForm token={token} clientName={payload.clientName} />
      </div>
    </main>
  );
}
