"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  X, FileText, Upload, UserPlus, CalendarPlus, ExternalLink, Loader2,
  Check, Undo2, Repeat, ArrowRight, Video,
} from "lucide-react"
import {
  Avatar, Card, StatusBadge, VerdictBadge, AdminActionBadge, OutcomeBadge,
  InterviewStatusBadge, ParticipantRoleBadge,
} from "./ui"
import { AssignCvModal } from "./assign-cv-modal"
import { ScheduleInterviewModal } from "./schedule-interview-modal"
import { cn } from "@/lib/utils"
import { statusConfig } from "@/lib/badges"
import { getCandidateById, getCandidateHistory, getInterviewsForCandidate } from "@/lib/fastapi-queries"
import type { Candidate, CvStatus, CandidateHistoryEntry, Interview, AdminAction } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

const shortDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—"

interface ReviewRow {
  reviewId: string
  reviewerName: string
  verdict: string | null
  notes: string | null
  submittedAt: string | null
  adminAction: string | null
  adminNote: string | null
  outcome: string | null
}

interface ReviewSummary {
  totalReviews: number
  shortlistCount: number
  rejectCount: number
  reviews: ReviewRow[]
}

async function fetchReviewSummary(candidateId: string): Promise<ReviewSummary> {
  const res = await fetch(`${API_URL}/reviews/candidate/${candidateId}/summary`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (!res.ok) return { totalReviews: 0, shortlistCount: 0, rejectCount: 0, reviews: [] }
  const d = await res.json()
  return {
    totalReviews: d.total_reviews ?? 0,
    shortlistCount: d.verdicts?.shortlist ?? 0,
    rejectCount: d.verdicts?.reject ?? 0,
    reviews: (d.reviews ?? []).map((r: any) => ({
      reviewId: r.review_id,
      reviewerName: r.reviewer_name,
      verdict: r.verdict,
      notes: r.notes,
      submittedAt: r.submitted_at,
      adminAction: r.admin_action,
      adminNote: r.admin_note,
      outcome: r.outcome,
    })),
  }
}

/** Mirrors the backend's effective_outcome() so buttons can preview the consequence. */
function previewOutcome(verdict: string | null, action: AdminAction): "interview" | "archive" | "reassigned" {
  if (action === "reassigned") return "reassigned"
  const shortlisted = verdict === "shortlist"
  const inverted = action === "overridden" ? !shortlisted : shortlisted
  return inverted ? "interview" : "archive"
}

const outcomeCopy: Record<"interview" | "archive" | "reassigned", { label: string; className: string }> = {
  interview:  { label: "Goes to interview scheduling", className: "text-[#2f5d40]" },
  archive:    { label: "Goes to the archive", className: "text-[#5f5954]" },
  reassigned: { label: "Sent to a different teacher", className: "text-[#33506a]" },
}

// ── Reassign / accept / revert modal ────────────────────────────────────────────

function ReviewDecisionModal({
  review,
  candidateName,
  action,
  onClose,
  onDone,
}: {
  review: ReviewRow
  candidateName: string
  action: AdminAction
  onClose: () => void
  onDone: () => void
}) {
  const [note, setNote] = useState("")
  const [teachers, setTeachers] = useState<{ id: string; full_name: string }[]>([])
  const [newTeacherId, setNewTeacherId] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const outcome = previewOutcome(review.verdict, action)

  useEffect(() => {
    if (action !== "reassigned") return
    fetch(`${API_URL}/users/`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json())
      .then((d: any[]) => setTeachers(d.filter((u) => u.roles?.includes("teacher"))))
      .catch(() => {})
  }, [action])

  async function submit() {
    if (action === "reassigned" && !newTeacherId) {
      setError("Pick a teacher to reassign to.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/reviews/${review.reviewId}/admin-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          action,
          note: note || null,
          new_teacher_id: action === "reassigned" ? newTeacherId : null,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as any).detail ?? "Could not record the decision.")
        return
      }
      onDone()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const titles: Record<AdminAction, string> = {
    accepted: "Accept this decision",
    overridden: "Revert this decision",
    reassigned: "Reassign to another teacher",
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-md bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">{titles[action]}</h2>
            <p className="text-xs text-muted-foreground">{candidateName} · {review.reviewerName}</p>
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        {action !== "reassigned" && (
          <div className="mb-4 rounded-md border border-border bg-muted/40 p-3 text-sm">
            <p className="text-muted-foreground">
              {review.reviewerName} decided <strong className="text-foreground">
                {review.verdict === "shortlist" ? "shortlist" : "reject"}
              </strong>.
            </p>
            <p className="mt-2 flex items-center gap-1.5 font-medium">
              <ArrowRight className="size-4 shrink-0" />
              <span className={outcomeCopy[outcome].className}>{outcomeCopy[outcome].label}</span>
            </p>
          </div>
        )}

        {action === "reassigned" && (
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">New Teacher</label>
            <select
              value={newTeacherId}
              onChange={(e) => setNewTeacherId(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-brand"
            >
              <option value="">Select a teacher…</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
        )}

        <label className="mb-1 block text-xs font-medium text-muted-foreground">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mb-4 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
        />

        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          onClick={submit}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : "Confirm"}
        </button>
      </div>
    </div>
  )
}

// ── Final interview decision modal ──────────────────────────────────────────────

function FinalDecisionModal({
  interviewId,
  candidateName,
  onClose,
  onDone,
}: {
  interviewId: string
  candidateName: string
  onClose: () => void
  onDone: () => void
}) {
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState<"accept" | "reject" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(outcome: "accept" | "reject") {
    setSaving(outcome)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/interviews/${interviewId}/final-outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ outcome, note: note || null }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as any).detail ?? "Could not record the final decision.")
        return
      }
      onDone()
      onClose()
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-md bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">Final Decision</h2>
            <p className="text-xs text-muted-foreground">{candidateName}</p>
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <label className="mb-1 block text-xs font-medium text-muted-foreground">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mb-4 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
        />

        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => submit("accept")}
            disabled={saving !== null}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#2f5d40] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving === "accept" && <Loader2 className="size-4 animate-spin" />}
            Accept
          </button>
          <button
            onClick={() => submit("reject")}
            disabled={saving !== null}
            className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            {saving === "reject" && <Loader2 className="size-4 animate-spin" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main panel ───────────────────────────────────────────────────────────────────

const tabs = ["Profile", "Reviews", "Interviews"] as const
type Tab = (typeof tabs)[number]

export function CandidatePanel({
  candidateId,
  initialTab = "Profile",
  onClose,
  onChanged,
}: {
  candidateId: string
  initialTab?: Tab
  onClose: () => void
  onChanged: () => void
}) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [loading, setLoading] = useState(true)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [status, setStatus] = useState<CvStatus>("uploaded")
  const [history, setHistory] = useState<CandidateHistoryEntry[]>([])
  const [reviews, setReviews] = useState<ReviewSummary>({ totalReviews: 0, shortlistCount: 0, rejectCount: 0, reviews: [] })
  const [interviews, setInterviews] = useState<Interview[]>([])

  const [showAssign, setShowAssign] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [showFinalDecision, setShowFinalDecision] = useState(false)
  const [reviewDecision, setReviewDecision] = useState<{ review: ReviewRow; action: AdminAction } | null>(null)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      getCandidateById(candidateId),
      getCandidateHistory(candidateId),
      fetchReviewSummary(candidateId),
      getInterviewsForCandidate(candidateId),
    ]).then(([c, hist, revSummary, ivs]) => {
      if (c) { setCandidate(c); setStatus(c.status) }
      setHistory(hist)
      setReviews(revSummary)
      setInterviews(ivs)
      setLoading(false)
    })
  }, [candidateId])

  useEffect(() => { load() }, [load])
  useEffect(() => { setTab(initialTab) }, [initialTab, candidateId])

  function refresh() {
    load()
    onChanged()
  }

  async function changeStatus(next: CvStatus) {
    setStatus(next)
    await fetch(`${API_URL}/candidates/${candidateId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status: next.toUpperCase() }),
    }).catch(() => {})
    onChanged()
  }

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      await fetch(`${API_URL}/candidates/${candidateId}/upload-cv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      })
    } finally {
      setUploading(false)
    }
  }

  const latestCompletedInterview = [...interviews]
    .filter((iv) => iv.status === "completed")
    .sort((a, b) => b.round - a.round)[0]

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-card shadow-xl">
        {loading || !candidate ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {loading ? "Loading…" : "Candidate not found"}
          </div>
        ) : (
          <>
            <div className="border-b border-border p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar name={candidate.name} size="md" />
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{candidate.name}</h2>
                    <p className="truncate text-xs text-muted-foreground">{candidate.email}</p>
                    {candidate.phone && <p className="text-xs text-muted-foreground">{candidate.phone}</p>}
                  </div>
                </div>
                <button onClick={onClose} className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={status} />
                <select
                  value={status}
                  onChange={(e) => changeStatus(e.target.value as CvStatus)}
                  className="h-7 rounded border border-border bg-background px-2 text-xs outline-none focus:border-brand"
                >
                  {(Object.keys(statusConfig) as CvStatus[]).map((s) => (
                    <option key={s} value={s}>{statusConfig[s].label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-1 border-b border-border px-5">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    tab === t ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {tab === "Profile" && (
                <div className="space-y-5">
                  <Card className="flex flex-col p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">CV</p>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
                        {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                        Upload
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                        />
                      </label>
                    </div>
                    <div className="flex items-center justify-center rounded-md border border-dashed border-border bg-muted/50 py-14 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="size-8" />
                        <p className="text-xs">PDF preview</p>
                      </div>
                    </div>
                  </Card>

                  {candidate.status === "pending_assignment" || candidate.status === "uploaded" ? (
                    <button
                      onClick={() => setShowAssign(true)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90"
                    >
                      <UserPlus className="size-4" /> Assign to Teacher
                    </button>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3">
                    <InfoCell label="Subject" value={candidate.subject} />
                    <InfoCell label="Experience" value={`${candidate.experienceYears} years`} />
                    <InfoCell label="Qualification" value={candidate.qualification} />
                    <InfoCell label="Employer" value={candidate.employer} />
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Status History
                    </p>
                    {history.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
                    ) : (
                      <ol className="relative space-y-4 border-l border-border pl-5">
                        {history.map((h, i) => (
                          <li key={i} className="relative">
                            <span className={cn("absolute -left-[23px] top-1 size-2.5 rounded-full ring-4 ring-card", historyDotColor(h.toStatus))} />
                            <p className="text-sm font-medium">
                              {h.fromStatus ? `${prettyStatus(h.fromStatus)} → ` : ""}{prettyStatus(h.toStatus)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {h.changedByName ?? "System"} · {shortDateTime(h.changedAt)}
                            </p>
                            {h.reason && <p className="mt-0.5 text-xs text-muted-foreground">{h.reason}</p>}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              )}

              {tab === "Reviews" && (
                <div className="space-y-4">
                  {reviews.reviews.length === 0 ? (
                    <Card className="p-6 text-center">
                      <p className="mb-3 text-sm text-muted-foreground">No reviews submitted</p>
                      <button
                        onClick={() => setShowAssign(true)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground hover:bg-brand/90"
                      >
                        <UserPlus className="size-3.5" /> Assign
                      </button>
                    </Card>
                  ) : (
                    <>
                      <Card className="flex gap-6 p-4">
                        <Aggregate label="Shortlisted" value={reviews.shortlistCount} className="text-[#2f5d40]" />
                        <Aggregate label="Rejected" value={reviews.rejectCount} className="text-[#8c3130]" />
                      </Card>

                      {reviews.reviews.map((r) => (
                        <Card key={r.reviewId} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={r.reviewerName} size="sm" className="bg-slate-500" />
                              <div>
                                <p className="text-sm font-medium">{r.reviewerName}</p>
                                <p className="text-xs text-muted-foreground">{shortDateTime(r.submittedAt)}</p>
                              </div>
                            </div>
                            {r.verdict && <VerdictBadge verdict={r.verdict} />}
                          </div>

                          {r.notes && <p className="mt-3 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">{r.notes}</p>}

                          {r.adminAction ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs">
                              <span className="text-muted-foreground">Admin:</span>
                              <AdminActionBadge action={r.adminAction} />
                              {r.outcome && <OutcomeBadge verdict={r.outcome} />}
                              {r.adminNote && <span className="text-muted-foreground">— {r.adminNote}</span>}
                            </div>
                          ) : (
                            <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                              <button
                                onClick={() => setReviewDecision({ review: r, action: "accepted" })}
                                className="inline-flex items-center gap-1.5 rounded-md bg-[#2f5d40] px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90"
                              >
                                <Check className="size-3.5" /> Accept Decision
                              </button>
                              <button
                                onClick={() => setReviewDecision({ review: r, action: "overridden" })}
                                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                              >
                                <Undo2 className="size-3.5" /> Revert
                              </button>
                              <button
                                onClick={() => setReviewDecision({ review: r, action: "reassigned" })}
                                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                              >
                                <Repeat className="size-3.5" /> Reassign
                              </button>
                            </div>
                          )}
                        </Card>
                      ))}
                    </>
                  )}
                </div>
              )}

              {tab === "Interviews" && (
                <div className="space-y-4">
                  {interviews.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      No interviews scheduled yet.
                    </p>
                  ) : (
                    <ol className="relative space-y-4 border-l border-border pl-6">
                      {[...interviews].sort((a, b) => a.round - b.round).map((iv) => (
                        <li key={iv.id} className="relative">
                          <span className="absolute -left-[31px] top-1 flex size-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                            {iv.round}
                          </span>
                          <Card className="p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold">Round {iv.round}</p>
                              <InterviewStatusBadge status={iv.status} />
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{iv.date} · {iv.time} · {iv.location}</p>
                            {iv.meetingLink && (
                              <a
                                href={iv.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                              >
                                <Video className="size-3.5" /> Join meeting <ExternalLink className="size-3" />
                              </a>
                            )}
                            {iv.panel.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {iv.panel.map((p) => (
                                  <div key={p.userId} className="rounded-md border border-border p-2.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-xs font-medium">{p.name}</span>
                                      <ParticipantRoleBadge role={p.role} />
                                      {p.outcome ? (
                                        <OutcomeBadge verdict={p.outcome} />
                                      ) : (
                                        <span className="text-[11px] text-muted-foreground">Feedback pending</span>
                                      )}
                                    </div>
                                    {(p.strengths || p.concerns) && (
                                      <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                                        {p.strengths && <p><span className="font-medium text-foreground">Strengths:</span> {p.strengths}</p>}
                                        {p.concerns && <p><span className="font-medium text-foreground">Concerns:</span> {p.concerns}</p>}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </Card>
                        </li>
                      ))}
                    </ol>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowSchedule(true)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <CalendarPlus className="size-4" />
                      {interviews.length === 0 ? "Schedule Interview" : "Schedule Next Round"}
                    </button>
                    <button
                      onClick={() => setShowFinalDecision(true)}
                      disabled={!latestCompletedInterview}
                      title={latestCompletedInterview ? undefined : "Complete an interview round first"}
                      className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Final Decision
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {showAssign && candidate && (
        <AssignCvModal
          candidateId={candidateId}
          candidateName={candidate.name}
          onClose={() => setShowAssign(false)}
          onDone={refresh}
        />
      )}

      {showSchedule && candidate && (
        <ScheduleInterviewModal
          candidate={{ id: candidateId, name: candidate.name }}
          roundNumber={interviews.length + 1}
          onClose={() => setShowSchedule(false)}
          onDone={refresh}
        />
      )}

      {showFinalDecision && latestCompletedInterview && candidate && (
        <FinalDecisionModal
          interviewId={latestCompletedInterview.id}
          candidateName={candidate.name}
          onClose={() => setShowFinalDecision(false)}
          onDone={refresh}
        />
      )}

      {reviewDecision && candidate && (
        <ReviewDecisionModal
          review={reviewDecision.review}
          candidateName={candidate.name}
          action={reviewDecision.action}
          onClose={() => setReviewDecision(null)}
          onDone={refresh}
        />
      )}
    </div>
  )
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}

function Aggregate({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="text-center">
      <p className={cn("text-xl font-bold tabular-nums", className)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function prettyStatus(s: string): string {
  return s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

function historyDotColor(toStatus: string): string {
  const s = toStatus.toUpperCase()
  if (["ACCEPTED", "SHORTLISTED"].includes(s)) return "bg-[#4a7a5b]"
  if (["REJECTED", "ON_HOLD"].includes(s)) return "bg-[#a1504e]"
  if (["PENDING_DECISION", "OFFER_PENDING"].includes(s)) return "bg-[#b99b53]"
  return "bg-[#6b87a3]"
}
