import { Topbar } from "@/components/portal/topbar"
import { getCandidates } from "@/lib/fastapi-queries"
import { CandidatesClient } from "@/components/portal/candidates-client"
import { statusConfig } from "@/lib/badges"
import type { CvStatus } from "@/lib/data"

const statusFilters: ("all" | CvStatus)[] = [
  "all", "uploaded", "pending_assignment", "assigned", "under_review",
  "shortlisted", "interview_scheduled", "interview_done", "offer_pending",
  "accepted", "rejected",
]

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const initialStatus = (params.status ?? "all") as "all" | CvStatus

  const all = await getCandidates()
  const active   = all.filter((c) => c.status !== "on_hold")
  const archived = all.filter((c) => c.status === "on_hold")

  return (
    <>
      <Topbar title="Candidates" subtitle={`${active.length} active · ${archived.length} archived`} />
      <CandidatesClient
        candidates={active}
        archivedCandidates={archived}
        statusFilters={statusFilters}
        statusConfig={statusConfig}
        initialStatus={initialStatus}
      />
    </>
  )
}
