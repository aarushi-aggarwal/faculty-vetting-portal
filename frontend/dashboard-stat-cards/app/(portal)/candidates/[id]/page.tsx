"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Star,
  Video,
  ArrowLeft,
  Plus,
  CalendarPlus,
  UserPlus,
} from "lucide-react"
import { Topbar } from "@/components/portal/topbar"
import {
  Avatar,
  Card,
  InterviewStatusBadge,
  OutcomeBadge,
  StatusBadge,
} from "@/components/portal/ui"
import { useRole } from "@/components/portal/role-context"
import { cn } from "@/lib/utils"
import { statusConfig } from "@/lib/badges"
import { candidateReviews, interviews as allInterviews, type CvStatus } from "@/lib/data"
import { getCandidateById } from "@/lib/fastapi-queries"
import type { Candidate } from "@/lib/data"

const tabs = ["Overview", "Reviews", "Interviews", "History"] as const
type Tab = (typeof tabs)[number]

const verdictBadge: Record<string, string> = {
  shortlist: "bg-green-100 text-green-700 ring-green-200",
  reject: "bg-red-100 text-red-700 ring-red-200",
  flag: "bg-amber-100 text-amber-800 ring-amber-200",
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-4",
            n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  )
}

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { role } = useRole()
  const [tab, setTab] = useState<Tab>("Overview")
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [status, setStatus] = useState<CvStatus>("uploaded")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCandidateById(id).then((c) => {
      if (c) {
        setCandidate(c)
        setStatus(c.status)
      }
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <>
        <Topbar title="Candidate Detail" />
        <div className="flex items-center justify-center p-20 text-muted-foreground text-sm">
          Loading candidate…
        </div>
      </>
    )
  }

  if (!candidate) notFound()

  const reviews = candidateReviews[id] ?? []
  const interviews = allInterviews.filter((i) => i.candidate === candidate.name)
  const isAdmin = role !== "teacher"

  const shortlisted = reviews.filter((r) => r.verdict === "shortlist").length
  const rejected = reviews.filter((r) => r.verdict === "reject").length
  const flagged = reviews.filter((r) => r.verdict === "flag").length
  const avgScore =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "—"

  const history = [
    { color: "bg-slate-400", label: "CV uploaded", by: "Admin L2 — Ravi Shah", time: candidate.uploadedOn, reason: "" },
    { color: "bg-blue-400", label: "Assigned to reviewers", by: "Admin L2", time: candidate.uploadedOn, reason: "" },
  ]

  return (
    <>
      <Topbar title="Candidate Detail" />
      <div className="p-6">
        <Link
          href="/candidates"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Candidates
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* PDF preview */}
          <div className="lg:col-span-2">
            <Card className="flex h-full flex-col p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">CV Preview</p>
                <button className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                  <Download className="size-4" />
                </button>
              </div>
              <p className="mb-3 truncate text-xs text-muted-foreground">
                {candidate.name.replace(/\s+/g, "_")}_CV.pdf
              </p>
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 py-24">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileText className="size-12" />
                  <p className="text-sm">PDF preview</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted">
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="px-2 text-xs text-muted-foreground">Page 1 of 3</span>
                  <button className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted">
                    <ChevronRight className="size-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted">
                    <ZoomOut className="size-4" />
                  </button>
                  <button className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted">
                    <ZoomIn className="size-4" />
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Detail */}
          <div className="space-y-4 lg:col-span-3">
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{candidate.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {candidate.email} · {candidate.phone}
                  </p>
                  <div className="mt-3">
                    <StatusBadge status={status} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  {isAdmin && (
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as CvStatus)}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    >
                      {(Object.keys(statusConfig) as CvStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {statusConfig[s].label}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex gap-2">
                    <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground hover:bg-brand/90">
                      <UserPlus className="size-4" />
                      Assign CV
                    </button>
                    <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted">
                      <CalendarPlus className="size-4" />
                      Schedule Interview
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-5 flex gap-1 border-b border-border">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                      tab === t
                        ? "border-brand text-brand"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="pt-5">
                {tab === "Overview" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <InfoCard label="Preferred Subject" value={candidate.subject} />
                      <InfoCard label="Experience" value={`${candidate.experienceYears} years`} />
                      <InfoCard label="Qualification" value={candidate.qualification} />
                      <InfoCard label="Current Employer" value={candidate.employer} />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Notes</h3>
                        <button className="text-xs font-medium text-brand hover:underline">
                          Edit
                        </button>
                      </div>
                      <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                        No notes yet.
                      </p>
                    </div>
                  </div>
                )}

                {tab === "Reviews" && (
                  <div className="space-y-4">
                    {role === "teacher" && (
                      <Card className="border-brand/40 bg-brand/5 p-4">
                        <h3 className="text-sm font-semibold">Submit your review</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Provide a verdict, strengths, concerns, and dimension scores.
                        </p>
                        <button className="mt-3 inline-flex h-8 items-center rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground hover:bg-brand/90">
                          Open Review Form
                        </button>
                      </Card>
                    )}
                    <p className="text-sm font-semibold">
                      {reviews.length} reviewer{reviews.length === 1 ? "" : "s"} assigned
                    </p>
                    {reviews.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No reviews submitted yet.
                      </p>
                    )}
                    {reviews.map((r) => (
                      <Card key={r.reviewerName} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar name={r.reviewerName} size="sm" className="bg-slate-500" />
                            <div>
                              <p className="text-sm font-medium">{r.reviewerName}</p>
                              <p className="text-xs text-muted-foreground">{r.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Stars value={r.rating} />
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
                                verdictBadge[r.verdict],
                              )}
                            >
                              {r.verdict}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-green-50 p-3">
                            <p className="text-xs font-semibold text-green-700">Strengths</p>
                            <p className="mt-1 text-sm text-green-900/80">{r.strengths}</p>
                          </div>
                          <div className="rounded-lg bg-red-50 p-3">
                            <p className="text-xs font-semibold text-red-700">Concerns</p>
                            <p className="mt-1 text-sm text-red-900/80">{r.concerns}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {reviews.length > 0 && (
                      <Card className="grid grid-cols-2 gap-3 bg-muted/40 p-4 sm:grid-cols-4">
                        <Aggregate label="Shortlisted" value={shortlisted} tone="text-green-600" />
                        <Aggregate label="Rejected" value={rejected} tone="text-red-600" />
                        <Aggregate label="Flagged" value={flagged} tone="text-amber-600" />
                        <Aggregate label="Avg Score" value={avgScore} tone="text-foreground" />
                      </Card>
                    )}
                  </div>
                )}

                {tab === "Interviews" && (
                  <div className="space-y-4">
                    {interviews.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No interviews scheduled yet.
                      </p>
                    )}
                    <ol className="relative space-y-4 border-l border-border pl-6">
                      {interviews.map((iv) => (
                        <li key={iv.id} className="relative">
                          <span className="absolute -left-[31px] top-1 flex size-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                            {iv.round}
                          </span>
                          <Card className="p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold">Round {iv.round}</p>
                              <InterviewStatusBadge status={iv.status} />
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {iv.date} · {iv.time} · {iv.duration} · {iv.platform}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <button className="inline-flex h-7 items-center gap-1 rounded-md bg-brand/10 px-2 text-xs font-medium text-brand hover:bg-brand/20">
                                <Video className="size-3.5" />
                                Meeting link
                              </button>
                              {iv.interviewers?.map((p) => (
                                <span
                                  key={p.name}
                                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                                >
                                  {p.name}
                                  <span className="text-muted-foreground">· {p.role}</span>
                                </span>
                              ))}
                            </div>
                            {iv.outcomes && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {iv.outcomes.map((o) => (
                                  <span key={o.name} className="flex items-center gap-1.5 text-xs">
                                    <span className="text-muted-foreground">{o.name}:</span>
                                    <OutcomeBadge verdict={o.verdict} />
                                  </span>
                                ))}
                              </div>
                            )}
                          </Card>
                        </li>
                      ))}
                    </ol>
                    <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted">
                      <Plus className="size-4" />
                      Schedule Next Round
                    </button>
                  </div>
                )}

                {tab === "History" && (
                  <ol className="relative space-y-5 border-l border-border pl-6">
                    {history.map((h, i) => (
                      <li key={i} className="relative">
                        <span
                          className={cn(
                            "absolute -left-[29px] top-1 size-3 rounded-full ring-4 ring-card",
                            h.color,
                          )}
                        />
                        <p className="text-sm font-medium">{h.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {h.by} · {h.time}
                        </p>
                        {h.reason && (
                          <p className="mt-1 text-xs italic text-muted-foreground/80">
                            {h.reason}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}

function Aggregate({
  label,
  value,
  tone,
}: {
  label: string
  value: number | string
  tone: string
}) {
  return (
    <div className="text-center">
      <p className={cn("text-xl font-bold tabular-nums", tone)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
