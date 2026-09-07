"use client"

import { Fragment, useState } from "react"
import { Video, ChevronDown, ChevronUp } from "lucide-react"
import { Avatar, Card, InterviewStatusBadge } from "./ui"
import { useSortableRows, SortableTh } from "./sortable"
import { InterviewFeedbackForm } from "./interview-feedback-form"
import { interviewStatusConfig } from "@/lib/badges"
import { cn } from "@/lib/utils"
import type { Interview } from "@/lib/data"

type SortKey = "candidate" | "startTime" | "location" | "status"

/** A left accent so scheduled vs. completed reads as a different colour at a glance. */
function rowAccent(status: Interview["status"]): string {
  return interviewStatusConfig[status]?.accent ?? "border-l-slate-300"
}

export function MyInterviewsClient({ interviews }: { interviews: Interview[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const { sorted, sortKey, sortDir, toggleSort } = useSortableRows<Interview, SortKey>(
    interviews,
    {
      candidate: (i) => i.candidate.toLowerCase(),
      startTime: (i) => new Date(i.startTime),
      location: (i) => (i.location ?? "").toLowerCase(),
      status: (i) => i.status,
    },
    { key: "startTime", dir: "asc" },
  )

  return (
    <div className="space-y-4 p-6">
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <SortableTh label="Candidate" sortKey="candidate" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Date & Time" sortKey="startTime" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Location" sortKey="location" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((iv) => (
                <Fragment key={iv.id}>
                  <tr className={cn("border-l-4 hover:bg-muted/40", rowAccent(iv.status))}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={iv.candidate} size="sm" />
                        <p className="font-medium">{iv.candidate}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{iv.date} · {iv.time}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Video className="size-4" />
                        {iv.location}
                      </span>
                    </td>
                    <td className="px-3 py-3"><InterviewStatusBadge status={iv.status} /></td>
                    <td className="px-5 py-3 text-right">
                      {iv.status === "completed" && (
                        <button
                          onClick={() => setExpanded((prev) => (prev === iv.id ? null : iv.id))}
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                        >
                          Feedback {expanded === iv.id ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === iv.id && (
                    <tr className={cn("border-l-4", rowAccent(iv.status))}>
                      <td colSpan={5} className="bg-muted/20 px-5 py-3">
                        <InterviewFeedbackForm interviewId={iv.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            No interviews scheduled yet.
          </div>
        )}
      </Card>
    </div>
  )
}
