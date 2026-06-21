"use client"

import { useMemo, useState } from "react"
import { Search, X, RefreshCw, UserPlus, AlertTriangle } from "lucide-react"
import { Avatar, AssignmentStatusBadge, Card, PriorityBadge } from "./ui"
import { cn } from "@/lib/utils"
import { initials } from "@/lib/badges"
import type { Assignment, AssignmentStatus } from "@/lib/data"

export function AssignmentsClient({ assignments }: { assignments: Assignment[] }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | AssignmentStatus>("all")
  const [selected, setSelected] = useState<Assignment | null>(null)

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      const q = query.toLowerCase()
      const matchesQuery =
        a.candidate.toLowerCase().includes(q) ||
        a.teachers.some((t) => t.toLowerCase().includes(q))
      const matchesStatus = status === "all" || a.status === status
      return matchesQuery && matchesStatus
    })
  }, [query, status, assignments])

  const stats = [
    { label: "Pending", value: assignments.filter((a) => a.status === "pending").length, tone: "yellow" },
    { label: "In Review", value: assignments.filter((a) => a.status === "in_review").length, tone: "purple" },
    { label: "Completed", value: assignments.filter((a) => a.status === "completed").length, tone: "green" },
  ]

  const statTone: Record<string, string> = {
    yellow: "text-amber-600",
    purple: "text-purple-600",
    green: "text-green-600",
  }

  return (
    <>
      <div className="space-y-4 p-6">
        {/* Stat row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label} className="p-4">
              <p className={cn("text-2xl font-bold tabular-nums", statTone[s.tone])}>
                {s.value}
              </p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Filter bar */}
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by candidate or teacher..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | AssignmentStatus)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
          </select>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Candidate</th>
                  <th className="px-3 py-3 font-medium">Assigned To</th>
                  <th className="px-3 py-3 font-medium">Priority</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Due Date</th>
                  <th className="px-5 py-3 font-medium">Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={cn(
                      "cursor-pointer hover:bg-muted/40",
                      a.status === "declined" && "bg-red-50/50",
                    )}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {a.status === "declined" && (
                          <AlertTriangle className="size-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{a.candidate}</p>
                          <p className="text-xs text-muted-foreground">{a.subject}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center">
                        <div className="flex -space-x-2">
                          {a.teachers.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              title={t}
                              className="flex size-7 items-center justify-center rounded-full bg-slate-500 text-xs font-semibold text-white ring-2 ring-card"
                            >
                              {initials(t)}
                            </span>
                          ))}
                        </div>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {a.teachers.length === 1
                            ? a.teachers[0]
                            : `${a.teachers.length} reviewers`}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <PriorityBadge priority={a.priority} />
                    </td>
                    <td className="px-3 py-3">
                      <AssignmentStatusBadge status={a.status} />
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn(a.overdue ? "font-semibold text-red-600" : "text-muted-foreground")}>
                        {a.dueDate}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{a.assignedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm text-muted-foreground">
            <span>Showing {filtered.length} of {assignments.length}</span>
          </div>
        </Card>
      </div>

      {/* Slide-in detail */}
      {selected && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <aside className="absolute right-0 top-0 flex h-full w-[380px] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">Assignment Detail</h2>
              <button
                onClick={() => setSelected(null)}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div>
                <p className="text-lg font-semibold">{selected.candidate}</p>
                <p className="text-sm text-muted-foreground">{selected.subject}</p>
                <div className="mt-2 flex gap-2">
                  <PriorityBadge priority={selected.priority} />
                  <AssignmentStatusBadge status={selected.status} />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Assigned Teachers
                </p>
                <ul className="space-y-2">
                  {selected.teachers.map((t) => (
                    <li
                      key={t}
                      className="flex items-center gap-3 rounded-lg border border-border p-2.5"
                    >
                      <Avatar name={t} size="sm" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t}</p>
                        <p className="text-xs text-muted-foreground">
                          {selected.status === "completed"
                            ? "Review submitted"
                            : selected.status === "declined"
                              ? "Declined assignment"
                              : "Review in progress"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Timeline
                </p>
                <ol className="relative space-y-3 border-l border-border pl-5 text-sm">
                  <li className="relative">
                    <span className="absolute -left-[23px] top-1 size-2.5 rounded-full bg-blue-400 ring-4 ring-card" />
                    Assigned on {selected.assignedDate}
                  </li>
                  <li className="relative">
                    <span className="absolute -left-[23px] top-1 size-2.5 rounded-full bg-purple-400 ring-4 ring-card" />
                    Due {selected.dueDate}
                  </li>
                </ol>
              </div>
            </div>
            <div className="flex gap-2 border-t border-border p-4">
              <button className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand text-sm font-medium text-brand-foreground hover:bg-brand/90">
                <RefreshCw className="size-4" />
                Reassign
              </button>
              <button className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted">
                <UserPlus className="size-4" />
                Add Reviewer
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
