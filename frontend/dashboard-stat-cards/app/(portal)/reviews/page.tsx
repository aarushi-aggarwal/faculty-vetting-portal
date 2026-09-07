import { Topbar } from "@/components/portal/topbar"
import { getPendingReviews } from "@/lib/fastapi-queries"
import { ReviewsClient } from "@/components/portal/reviews-client"

export default async function ReviewsPage() {
  const reviews = await getPendingReviews()

  return (
    <>
      <Topbar
        title="Reviews"
        subtitle={
          reviews.length === 1
            ? "1 teacher verdict waiting on you"
            : `${reviews.length} teacher verdicts waiting on you`
        }
      />
      <ReviewsClient reviews={reviews} />
    </>
  )
}
