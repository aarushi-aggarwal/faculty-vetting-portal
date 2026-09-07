import { Topbar } from "@/components/portal/topbar"
import { getMyAssignments } from "@/lib/fastapi-queries"
import { MyQueueClient } from "@/components/portal/my-queue-client"

export default async function MyQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const assignments = await getMyAssignments()

  return (
    <>
      <Topbar title="My Queue" subtitle="Scan assigned CVs and give your decision with reasoning" />
      <MyQueueClient
        assignments={assignments}
        initialTab={params.tab === "history" ? "history" : "queue"}
      />
    </>
  )
}
