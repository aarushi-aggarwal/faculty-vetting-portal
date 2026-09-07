import { Topbar } from "@/components/portal/topbar"
import { getAssignments, getCandidates } from "@/lib/fastapi-queries"
import { AssignmentsClient } from "@/components/portal/assignments-client"

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const initialStatus = params.status ?? "all"
  const [assignments, candidates] = await Promise.all([getAssignments(), getCandidates()])

  return (
    <>
      <Topbar title="Assignments" subtitle="CVs sent to teachers to scan and shortlist" />
      <AssignmentsClient
        assignments={assignments}
        candidates={candidates.filter((c) => c.status !== "on_hold")}
        initialStatus={initialStatus}
      />
    </>
  )
}
