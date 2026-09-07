"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Download, ArrowLeft, Plus, CalendarPlus, ThumbsUp, ThumbsDown,
} from "lucide-react"
import { Topbar } from "@/components/portal/topbar"
import { Avatar, Card, InterviewStatusBadge, StatusBadge } from "@/components/portal/ui"
import { ScheduleInterviewModal } from "@/components/portal/schedule-interview-modal"
import { useRole } from "@/components/portal/role-context"
import { cn } from "@/lib/utils"
import { statusConfig } from "@/lib/badges"
import { getCandidateById } from "@/lib/fastapi-queries"
import type { Candidate, CvStatus, Interview } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

const tabs = ["Overview", "Reviews", "Interviews"] as const
type Tab = (typeof tabs)[number]

interface ReviewRow {
  reviewer_name: string
  verdict: string | null
  notes: string | null
  submitted_at: string | null
}

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { role } = useRole()
  const [tab, setTab] = useState<Tab>("Overview")
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [status, setStatus] = useState<CvStatus>("uploaded")
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [showSchedule, setShowSchedule] = useState(false)

  useEffect(() => {
    getCandidateById(id).then((c) => {
      if (c) { setCandidate(c); setStatus(c.status) }
      setLoading(false)
    })

    const auth = { Authorization: `Bearer ${getToken()}` }

    fetch(`${API_URL}/reviews/candidate/${id}/summary`, { headers: auth })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setReviews(d.reviews ?? []))
      .catch(() => {})

    fetch(`${API_URL}/interviews/candidate/${id}`, { headers: auth })
      .then((r) => (r.ok ? r.json() : []))
      .then((d: any[]) =>
        setInterviews(
          (d ?? []).map((iv) => {
            const start = new Date(iv.start_time)
            return {
              id: iv.id,
              candidate: iv.candidate_name,
              round: iv.round_number,
              status: iv.status,
              date: start.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
              time: start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
              location: iv.meeting_platform ?? "Virtual",
              interviewers: (iv.panel ?? []).map((name: string) => ({ name, role: "Co-interviewer" as const })),
            } as Interview
          }),
        ),
      )
      .catch(() => {})
  }, [id])

  async function changeStatus(next: CvStatus) {
    setStatus(next)
    await fetch(`${API_URL}/candidates/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status: next.toUpperCase() }),
    }).catch(() => {})
  }

  if (loading) return (
    <>
      <Topbar title="Candidate Detail" />
      <div className="flex items-center justify-center p-20 text-sm text-muted-foreground">Loading candidate…</div>
    </>
  )

  if (!candidate) notFound()

  const isAdmin = role !== "teacher"
  const nextRound = interviews.length + 1
  const shortlists = reviews.filter((r) => r.verdict === "shortlist").length
  const rejects = reviews.filter((r) => r.verdict === "reject").length

  return (
    <>
      <Topbar title="Candidate Detail" />
      <div className="p-6">
        <Link
          href={isAdmin ? "/candidates" : "/my-queue"}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* CV preview */}
          <div className="lg:col-span-2">
            <Card className="flex h-full flex-col p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">CV Preview</p>
                <button className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><Download className="size-4" /></button>
              </div>
              <p className="mb-3 truncate text-xs text-muted-foreground">{candidate.name.replace(/\s+/g, "_")}_CV.pdf</p>
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 py-24">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileText className="size-12" /><p className="text-sm">PDF preview</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"><ChevronLeft className="size-4" /></button>
                  <span className="px-2 text-xs text-muted-foreground">Page 1 of 3</span>
                  <button className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"><ChevronRight className="size-4" /></button>
                </div>
                <div className="flex items-center gap-1">
                  <button className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"><ZoomOut className="size-4" /></button>
                  <button className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"><ZoomIn className="size-4" /></button>
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
                  <p className="mt-1 text-sm text-muted-foreground">{candidate.email} · {candidate.phone}</p>
                  <div className="mt-3"><StatusBadge status={status} /></div>
                </div>
                {isAdmin && (
                  <div className="flex flex-col items-end gap-3">
                    <select
                      value={status}
                      onChange={(e) => changeStatus(e.target.value as CvStatus)}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    >
                      {(Object.keys(statusConfig) as CvStatus[]).map((s) => (
                        <option key={s} value={s}>{statusConfig[s].label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => { setShowSchedule(true); setTab("Interviews") }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground hover:bg-brand/90"
                    >
                      <CalendarPlus className="size-4" /> Schedule Interview
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-1 border-b border-border">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                      tab === t ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="pt-5">
                {tab === "Overview" && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoCard label="Preferred Subject" value={candidate.subject} />
                    <InfoCard label="Experience" value={`${candidate.experienceYears} years`} />
                    <InfoCard label="Qualification" value={candidate.qualification} />
                    <InfoCard label="Current Employer" value={candidate.employer} />
                  </div>
                )}

                {tab === "Reviews" && (
                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No teacher has scanned this CV yet.
                      </p>
                    ) : (
                      <>
                        <div className="flex gap-4 text-sm">
                          <span className="font-medium text-green-600">{shortlists} shortlisted</span>
                          <span className="font-medium text-red-600">{rejects} rejected</span>
                        </div>
                        {reviews.map((r, i) => (
                          <Card key={i} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar name={r.reviewer_name} size="sm" className="bg-slate-500" />
                                <div>
                                  <p className="text-sm font-medium">{r.reviewer_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {r.submitted_at
                                      ? new Date(r.submitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                      : "—"}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                                  r.verdict === "shortlist"
                                    ? "bg-green-100 text-green-700 ring-green-200"
                                    : "bg-red-100 text-red-700 ring-red-200",
                                )}
                              >
                                {r.verdict === "shortlist"
                                  ? <><ThumbsUp className="size-3" /> Shortlisted</>
                                  : <><ThumbsDown className="size-3" /> Not shortlisted</>}
                              </span>
                            </div>
                            {r.notes && <p className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{r.notes}</p>}
                          </Card>
                        ))}
                      </>
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
                          <span className="absolute -left-[31px] top-1 flex size-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">{iv.round}</span>
                          <Card className="p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold">Round {iv.round}</p>
                              <InterviewStatusBadge status={iv.status} />
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{iv.date} · {iv.time} · {iv.location}</p>
                            {iv.interviewers && iv.interviewers.length > 0 && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Panel: {iv.interviewers.map((p) => p.name).join(", ")}
                              </p>
                            )}
                          </Card>
                        </li>
                      ))}
                    </ol>
                    {isAdmin && (
                      <button
                        onClick={() => setShowSchedule(true)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
                      >
                        <Plus className="size-4" />
                        {interviews.length === 0 ? "Schedule Interview" : "Schedule Next Round"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {showSchedule && (
        <ScheduleInterviewModal
          candidate={{ id, name: candidate.name }}
          roundNumber={nextRound}
          onClose={() => setShowSchedule(false)}
          onDone={(iv) => setInterviews((prev) => [...prev, iv])}
        />
      )}
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
