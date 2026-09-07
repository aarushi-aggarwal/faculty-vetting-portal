"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Clock, Video, Users2, Plus, Check, Ban, Loader2 } from "lucide-react"
import { Avatar, Card, InterviewStatusBadge } from "./ui"
import { ScheduleInterviewModal } from "./schedule-interview-modal"
import { interviewStatusConfig } from "@/lib/badges"
import { cn } from "@/lib/utils"
import type { Candidate, Interview } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

export function InterviewsClient({
  interviews,
  shortlisted,
}: {
  interviews: Interview[]
  shortlisted: Candidate[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [showSchedule, setShowSchedule] = useState(false)
  const [deciding, setDeciding] = useState<string | null>(null)

  const filtered = useMemo(
    () => interviews.filter((i) => i.candidate.toLowerCase().includes(query.toLowerCase())),
    [query, interviews],
  )

  /** The last step of the flow: after the interview, accept or reject the candidate. */
  async function recordFinal(interviewId: string, outcome: "accept" | "reject") {
    setDeciding(interviewId)
    try {
      const res = await fetch(`${API_URL}/interviews/${interviewId}/final-outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ outcome }),
      })
      if (res.ok) router.refresh()
    } finally {
      setDeciding(null)
    }
  }

  return (
    <>
      <div className="space-y-4 p-6">
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by candidate..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <button
            onClick={() => setShowSchedule(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="size-4" /> Schedule Interview
          </button>
        </Card>

        <div className="space-y-3">
          {filtered.map((iv) => (
            <Card
              key={iv.id}
              className={cn("border-l-4 p-4", interviewStatusConfig[iv.status]?.accent ?? "border-l-blue-500")}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={iv.candidate} size="sm" />
                  <div>
                    <p className="font-semibold">{iv.candidate}</p>
                    <p className="text-sm text-muted-foreground">Round {iv.round} · {iv.candidateEmail}</p>
                  </div>
                </div>
                <InterviewStatusBadge status={iv.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-4" />
                  {iv.date} · {iv.time}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Video className="size-4" />
                  {iv.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users2 className="size-4" />
                  {iv.interviewers && iv.interviewers.length > 0
                    ? iv.interviewers.map((p) => p.name).join(", ")
                    : "No panel assigned"}
                </span>
              </div>

              {iv.status === "completed" && (
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3">
                  <p className="flex-1 text-sm text-muted-foreground">
                    Interview done — record the final decision.
                  </p>
                  <button
                    onClick={() => recordFinal(iv.id, "accept")}
                    disabled={deciding === iv.id}
                    className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60"
                  >
                    {deciding === iv.id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    Accept candidate
                  </button>
                  <button
                    onClick={() => recordFinal(iv.id, "reject")}
                    disabled={deciding === iv.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60"
                  >
                    <Ban className="size-3.5" /> Reject
                  </button>
                </div>
              )}
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card className="p-10 text-center text-muted-foreground">
              {interviews.length === 0
                ? "No interviews scheduled yet — schedule one for a shortlisted candidate."
                : "No interviews match your search."}
            </Card>
          )}
        </div>
      </div>

      {showSchedule && (
        <ScheduleInterviewModal
          candidates={shortlisted}
          onClose={() => setShowSchedule(false)}
          onDone={() => router.refresh()}
        />
      )}
    </>
  )
}
