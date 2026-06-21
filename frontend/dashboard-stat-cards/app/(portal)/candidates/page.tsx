import Link from "next/link"
import { Search, ChevronRight } from "lucide-react"
import { Topbar } from "@/components/portal/topbar"
import { Avatar, Card, StatusBadge } from "@/components/portal/ui"
import { statusConfig } from "@/lib/badges"
import { getCandidates, type CvStatus } from "@/lib/fastapi-queries"
import { CandidatesClient } from "@/components/portal/candidates-client"

const statusFilters: ("all" | CvStatus)[] = [
  "all",
  "uploaded",
  "pending_assignment",
  "assigned",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interview_done",
  "offer_pending",
  "accepted",
  "rejected",
  "on_hold",
]

export default async function CandidatesPage() {
  const candidates = await getCandidates()

  return (
    <>
      <Topbar title="Candidates" subtitle={`${candidates.length} candidates shown`} />
      <CandidatesClient candidates={candidates} statusFilters={statusFilters} statusConfig={statusConfig} />
    </>
  )
}
