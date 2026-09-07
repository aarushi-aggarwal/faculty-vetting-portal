import { Topbar } from "@/components/portal/topbar"
import { getPendingReviews } from "@/lib/fastapi-queries"
import { ReviewsClient } from "@/components/portal/reviews-client"
import { FlowStrip } from "@/components/portal/flow-strip"

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
      <div className="px-6 pt-6">
        <FlowStrip active="decision" />
      </div>
      <ReviewsClient reviews={reviews} />
    </>
  )
}
