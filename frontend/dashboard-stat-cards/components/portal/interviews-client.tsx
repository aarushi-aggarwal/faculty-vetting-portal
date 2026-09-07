"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Video, Plus, Check, Ban, Loader2 } from "lucide-react"
import { Avatar, Card, InterviewStatusBadge } from "./ui"
import { ScheduleInterviewModal } from "./schedule-interview-modal"
import { useSortableRows, SortableTh } from "./sortable"
import { interviewStatusConfig } from "@/lib/badges"
import { cn } from "@/lib/utils"
import type { Candidate, Interview } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

type SortKey = "candidate" | "round" | "startTime" | "status"

/** A left accent so scheduled vs. completed reads as a different colour at a glance. */
function rowAccent(status: Interview["status"]): string {
  return interviewStatusConfig[status]?.accent ?? "border-l-slate-300"
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

  const { sorted, sortKey, sortDir, toggleSort } = useSortableRows<Interview, SortKey>(
    filtered,
    {
      candidate: (i) => i.candidate.toLowerCase(),
      round: (i) => i.round,
      startTime: (i) => new Date(i.startTime),
      status: (i) => i.status,
    },
    { key: "startTime", dir: "desc" },
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
              className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <button
            onClick={() => setShowSchedule(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-brand px-3 text-sm font-medium text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="size-4" /> Schedule Interview
          </button>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <SortableTh label="Candidate" sortKey="candidate" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableTh label="Round" sortKey="round" activeKey={sortKey} dir={sortDir} onSort={toggleSort} align="center" />
                  <SortableTh label="Date & Time" sortKey="startTime" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                  <th className="px-3 py-3 font-medium">Panel</th>
                  <SortableTh label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                  <th className="px-5 py-3 text-right font-medium">Final Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((iv) => (
                  <tr key={iv.id} className={cn("border-l-4 hover:bg-muted/40", rowAccent(iv.status))}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={iv.candidate} size="sm" />
                        <div>
                          <p className="font-medium">{iv.candidate}</p>
                          <p className="text-xs text-muted-foreground">{iv.candidateEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums text-muted-foreground">{iv.round}</td>
                    <td className="px-3 py-3 text-muted-foreground">{iv.date} · {iv.time}</td>
                    <td className="px-3 py-3">
                      {iv.panel.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Video className="size-3.5" /> {iv.panel.map((p) => p.name).join(", ")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No panel assigned</span>
                      )}
                    </td>
                    <td className="px-3 py-3"><InterviewStatusBadge status={iv.status} /></td>
                    <td className="px-5 py-3 text-right">
                      {iv.status === "completed" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => recordFinal(iv.id, "accept")}
                            disabled={deciding === iv.id}
                            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-2.5 py-1.5 text-xs font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60"
                          >
                            {deciding === iv.id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                            Accept
                          </button>
                          <button
                            onClick={() => recordFinal(iv.id, "reject")}
                            disabled={deciding === iv.id}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60"
                          >
                            <Ban className="size-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                      {interviews.length === 0
                        ? "No interviews scheduled yet — schedule one for a cleared candidate."
                        : "No interviews match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
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
