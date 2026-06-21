import { Plus } from "lucide-react"
import { Topbar } from "@/components/portal/topbar"
import { getInterviews } from "@/lib/fastapi-queries"
import { InterviewsClient } from "@/components/portal/interviews-client"

export default async function InterviewsPage() {
  const interviews = await getInterviews()

  return (
    <>
      <Topbar
        title="Interviews"
        actions={
          <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground hover:bg-brand/90">
            <Plus className="size-4" />
            Schedule Interview
          </button>
        }
      />
      <InterviewsClient interviews={interviews} />
    </>
  )
}
