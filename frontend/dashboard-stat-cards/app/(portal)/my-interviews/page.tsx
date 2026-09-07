import { Topbar } from "@/components/portal/topbar"
import { getMyInterviews } from "@/lib/fastapi-queries"
import { MyInterviewsClient } from "@/components/portal/my-interviews-client"

export default async function MyInterviewsPage() {
  const interviews = await getMyInterviews()

  return (
    <>
      <Topbar title="My Interviews" subtitle="Panels you are part of" />
      <MyInterviewsClient interviews={interviews} />
    </>
  )
}
