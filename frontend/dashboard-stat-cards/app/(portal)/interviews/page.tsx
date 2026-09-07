import { Topbar } from "@/components/portal/topbar"
import { getInterviews, getCandidates } from "@/lib/fastapi-queries"
import { InterviewsClient } from "@/components/portal/interviews-client"
import { FlowStrip } from "@/components/portal/flow-strip"

export default async function InterviewsPage() {
  const [interviews, candidates] = await Promise.all([getInterviews(), getCandidates()])

  // Candidates the admin has cleared, plus anyone mid-process who may need another round.
  const shortlisted = candidates.filter((c) =>
    ["shortlisted", "interview_scheduled", "interview_done"].includes(c.status),
  )

  return (
    <>
      <Topbar title="Interviews" subtitle="Schedule panels, then record the final decision" />
      <div className="px-6 pt-6">
        <FlowStrip active="interview" />
      </div>
      <InterviewsClient interviews={interviews} shortlisted={shortlisted} />
    </>
  )
}
