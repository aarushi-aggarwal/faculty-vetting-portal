"use client"

import { useState } from "react"
import Link from "next/link"
import { ExternalLink, Loader2, ThumbsUp, ThumbsDown, X, Clock } from "lucide-react"
import { Avatar, Card, PriorityBadge, VerdictBadge, AdminActionBadge, OutcomeBadge } from "./ui"
import { cn } from "@/lib/utils"
import type { Assignment, Verdict } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
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
  onDone: (id: string, verdict: Verdict, reasoning: string) => void
}) {
  const [reasoning, setReasoning] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!reasoning.trim()) {
      setError("Please explain your reasoning — the admin reviews this before deciding.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/assignments/${assignment.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ verdict, notes: reasoning.trim() }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as any).detail ?? "Could not save your decision.")
        return
      }
      onDone(assignment.id, verdict, reasoning.trim())
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-md bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">
              {verdict === "shortlist" ? "Shortlist for interview" : "Do not shortlist"}
            </h2>
            <p className="text-xs text-muted-foreground">{assignment.candidate} · {assignment.subject}</p>
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Your reasoning <span className="text-destructive">*</span>
        </label>
        <textarea
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          rows={4}
          autoFocus
          placeholder={
            verdict === "shortlist"
              ? "What makes this candidate worth interviewing?"
              : "Why is this candidate not a fit?"
          }
          className="mb-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <p className="mb-4 text-xs text-muted-foreground">
          An admin reviews your verdict and reasoning before the candidate moves on.
        </p>

        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          onClick={submit}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Submitting…" : "Submit to admin"}
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

  function applyDecision(id: string, verdict: Verdict, reasoning: string) {
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    setRows((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: "completed" as const, verdict, reasoning, completedDate: today, adminAction: null, outcome: null }
          : a,
      ),
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

        {tab === "queue" ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Candidate</th>
                    <th className="px-3 py-3 font-medium">Subject</th>
                    <th className="px-3 py-3 font-medium">Priority</th>
                    <th className="px-3 py-3 font-medium">Due Date</th>
                    <th className="px-5 py-3 text-right font-medium">Your decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {queue.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={a.candidate} size="sm" />
                          <p className="font-medium">{a.candidate}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{a.subject}</td>
                      <td className="px-3 py-3"><PriorityBadge priority={a.priority} /></td>
                      <td className="px-3 py-3">
                        <span className={cn(a.overdue ? "font-semibold text-destructive" : "text-muted-foreground")}>
                          {a.dueDate}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/candidates/${a.candidateId ?? a.id}`}
                            onClick={() => markOpened(a.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                          >
                            View CV <ExternalLink className="size-3.5" />
                          </Link>
                          <button
                            onClick={() => setDecision({ assignment: a, verdict: "shortlist" })}
                            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-2.5 py-1.5 text-xs font-medium text-brand-foreground hover:bg-brand/90"
                          >
                            <ThumbsUp className="size-3.5" /> Shortlist
                          </button>
                          <button
                            onClick={() => setDecision({ assignment: a, verdict: "reject" })}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                          >
                            <ThumbsDown className="size-3.5" /> Don't shortlist
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {queue.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                        Nothing to scan — your admin will assign CVs here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={a.candidate} size="sm" />
                    <div>
                      <p className="font-medium">{a.candidate}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.subject} · scanned {a.completedDate ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {a.verdict && <VerdictBadge verdict={a.verdict} />}
                    <Link
                      href={`/candidates/${a.candidateId ?? a.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                    >
                      View <ExternalLink className="size-3.5" />
                    </Link>
                  </div>
                </div>

                {a.reasoning && (
                  <p className="mt-3 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">{a.reasoning}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs">
                  <span className="text-muted-foreground">Admin:</span>
                  {a.adminAction ? (
                    <>
                      <AdminActionBadge action={a.adminAction} />
                      {a.outcome && <OutcomeBadge verdict={a.outcome} />}
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-3.5" /> Awaiting confirmation
                    </span>
                  )}
                </div>
              </Card>
            ))}
            {history.length === 0 && (
              <Card className="p-10 text-center text-muted-foreground">
                You have not scanned any CVs yet.
              </Card>
            )}
          </div>
        )}
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
