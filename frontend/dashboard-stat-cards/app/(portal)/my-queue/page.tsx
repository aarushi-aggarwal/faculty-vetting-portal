import { Topbar } from "@/components/portal/topbar"
import { getMyAssignments } from "@/lib/fastapi-queries"
import { MyQueueClient } from "@/components/portal/my-queue-client"
import { FlowStrip } from "@/components/portal/flow-strip"

export default async function MyQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const assignments = await getMyAssignments()

  return (
    <>
      <Topbar title="My Queue" subtitle="Scan assigned CVs and give your verdict with reasoning" />
      <div className="px-6 pt-6">
        <FlowStrip active="scan" />
      </div>
      <MyQueueClient
        assignments={assignments}
        initialTab={params.tab === "history" ? "history" : "queue"}
      />
    </>
  )
}
