import { Suspense } from "react"
import { Topbar } from "@/components/portal/topbar"
import { getCandidateBoard } from "@/lib/fastapi-queries"
import { CandidatesClient } from "@/components/portal/candidates-client"

export default async function CandidatesPage() {
  const candidates = await getCandidateBoard()

  return (
    <>
      <Topbar title="Candidates" subtitle={`${candidates.length} candidates`} />
      <Suspense>
        <CandidatesClient candidates={candidates} />
      </Suspense>
    </>
  )
}
