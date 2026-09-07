"use client"

import { useState } from "react"
import Link from "next/link"
import { ExternalLink, Loader2, ThumbsUp, ThumbsDown, X } from "lucide-react"
import { Avatar, Card, PriorityBadge } from "./ui"
import { cn } from "@/lib/utils"
import type { Assignment, Verdict } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

const verdictBadge: Record<Verdict, { label: string; className: string }> = {
  shortlist: { label: "Shortlisted", className: "bg-green-100 text-green-700 ring-green-200" },
  reject:    { label: "Not shortlisted", className: "bg-red-100 text-red-700 ring-red-200" },
}

function DecisionModal({
  assignment,
  verdict,
  onClose,
  onDone,
}: {
  assignment: Assignment
  verdict: Verdict
  onClose: () => void
  onDone: (id: string, verdict: Verdict) => void
}) {
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/assignments/${assignment.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ verdict, notes: notes || null }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as any).detail ?? "Could not save your decision.")
        return
      }
      onDone(assignment.id, verdict)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">
              {verdict === "shortlist" ? "Shortlist for interview" : "Do not shortlist"}
            </h2>
            <p className="text-xs text-muted-foreground">{assignment.candidate} · {assignment.subject}</p>
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder={verdict === "shortlist" ? "What stood out?" : "Why not a fit?"}
          className="mb-4 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
        />

        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          onClick={submit}
          disabled={saving}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60",
            verdict === "shortlist" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700",
          )}
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : verdict === "shortlist" ? "Confirm shortlist" : "Confirm"}
        </button>
      </div>
    </div>
  )
}

export function MyQueueClient({
  assignments,
  initialTab = "queue",
}: {
  assignments: Assignment[]
  initialTab?: "queue" | "history"
}) {
  const [tab, setTab] = useState<"queue" | "history">(initialTab)
  const [rows, setRows] = useState(assignments)
  const [decision, setDecision] = useState<{ assignment: Assignment; verdict: Verdict } | null>(null)

  const queue   = rows.filter((a) => a.status !== "completed")
  const history = rows.filter((a) => a.status === "completed")
  const visible = tab === "queue" ? queue : history

  /** Opening a CV moves the assignment to "In Review" so admins can see progress. */
  function markOpened(id: string) {
    fetch(`${API_URL}/assignments/${id}/open`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${getToken()}` },
    }).catch(() => {})
  }

  function applyDecision(id: string, verdict: Verdict) {
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    setRows((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "completed", verdict, completedDate: today } : a)),
    )
  }

  return (
    <>
      <div className="space-y-4 p-6">
        <div className="flex gap-1 border-b border-border">
          {([["queue", `To Scan (${queue.length})`], ["history", `History (${history.length})`]] as const).map(
            ([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  tab === key ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ),
          )}
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Candidate</th>
                  <th className="px-3 py-3 font-medium">Subject</th>
                  {tab === "queue" ? (
                    <>
                      <th className="px-3 py-3 font-medium">Priority</th>
                      <th className="px-3 py-3 font-medium">Due Date</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-3 font-medium">Decision</th>
                      <th className="px-3 py-3 font-medium">Scanned On</th>
                    </>
                  )}
                  <th className="px-5 py-3 text-right font-medium">
                    {tab === "queue" ? "Action" : "CV"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={a.candidate} size="sm" />
                        <p className="font-medium">{a.candidate}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{a.subject}</td>
                    {tab === "queue" ? (
                      <>
                        <td className="px-3 py-3"><PriorityBadge priority={a.priority} /></td>
                        <td className="px-3 py-3">
                          <span className={cn(a.overdue ? "font-semibold text-red-600" : "text-muted-foreground")}>
                            {a.dueDate}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/candidates/${a.candidateId ?? a.id}`}
                              onClick={() => markOpened(a.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                            >
                              View CV <ExternalLink className="size-3.5" />
                            </Link>
                            <button
                              onClick={() => setDecision({ assignment: a, verdict: "shortlist" })}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                            >
                              <ThumbsUp className="size-3.5" /> Shortlist
                            </button>
                            <button
                              onClick={() => setDecision({ assignment: a, verdict: "reject" })}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              <ThumbsDown className="size-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-3">
                          {a.verdict ? (
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                                verdictBadge[a.verdict].className,
                              )}
                            >
                              {verdictBadge[a.verdict].label}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{a.completedDate ?? "—"}</td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/candidates/${a.candidateId ?? a.id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                          >
                            View <ExternalLink className="size-4" />
                          </Link>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                      {tab === "queue"
                        ? "Nothing to scan — your admin will assign CVs here."
                        : "You have not scanned any CVs yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {decision && (
        <DecisionModal
          assignment={decision.assignment}
          verdict={decision.verdict}
          onClose={() => setDecision(null)}
          onDone={applyDecision}
        />
      )}
    </>
  )
}
