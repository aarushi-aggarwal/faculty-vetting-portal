import { Plus, Layers } from "lucide-react"
import { Topbar } from "@/components/portal/topbar"
import { getAssignments } from "@/lib/fastapi-queries"
import { AssignmentsClient } from "@/components/portal/assignments-client"

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const initialStatus = params.status ?? "all"
  const assignments = await getAssignments()

  return (
    <>
      <Topbar
        title="Assignments"
        actions={
          <div className="flex gap-2">
            <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground hover:bg-brand/90">
              <Plus className="size-4" /> Assign CV
            </button>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted">
              <Layers className="size-4" /> Bulk Assign
            </button>
          </div>
        }
      />
      <AssignmentsClient assignments={assignments} initialStatus={initialStatus} />
    </>
  )
}
