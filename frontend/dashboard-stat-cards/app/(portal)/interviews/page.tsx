import { Topbar } from "@/components/portal/topbar"
import { getInterviews, getCandidates } from "@/lib/fastapi-queries"
import { InterviewsClient } from "@/components/portal/interviews-client"

export default async function InterviewsPage() {
  const [interviews, candidates] = await Promise.all([getInterviews(), getCandidates()])

  // Shortlisted candidates are the ones waiting to be put up for interviews,
  // plus anyone already in the interview stage who may need another round.
  const shortlisted = candidates.filter((c) =>
    ["shortlisted", "interview_scheduled", "interview_done"].includes(c.status),
  )

  return (
    <>
      <Topbar title="Interviews" subtitle="Panels for shortlisted candidates" />
      <InterviewsClient interviews={interviews} shortlisted={shortlisted} />
    </>
  )
}
