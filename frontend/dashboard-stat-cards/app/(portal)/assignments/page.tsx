import { Topbar } from "@/components/portal/topbar"
import { getAssignments, getCandidates } from "@/lib/fastapi-queries"
import { AssignmentsClient } from "@/components/portal/assignments-client"
import { FlowStrip } from "@/components/portal/flow-strip"

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
      <div className="px-6 pt-6">
        <FlowStrip active="assign" />
      </div>
      <AssignmentsClient
        assignments={assignments}
        candidates={candidates.filter((c) => c.status !== "on_hold")}
        initialStatus={initialStatus}
      />
    </>
  )
}
