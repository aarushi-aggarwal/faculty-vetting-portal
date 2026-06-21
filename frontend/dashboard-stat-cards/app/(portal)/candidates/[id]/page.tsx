"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Download, Star, Video, ArrowLeft, Plus, CalendarPlus, UserPlus,
  X, Loader2, CheckCircle2,
} from "lucide-react"
import { Topbar } from "@/components/portal/topbar"
import { Avatar, Card, InterviewStatusBadge, OutcomeBadge, StatusBadge } from "@/components/portal/ui"
import { useRole } from "@/components/portal/role-context"
import { cn } from "@/lib/utils"
import { statusConfig } from "@/lib/badges"
import { candidateReviews, type CvStatus, type Interview } from "@/lib/data"
import { getCandidateById } from "@/lib/fastapi-queries"
import type { Candidate } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

const tabs = ["Overview", "Reviews", "Interviews", "History"] as const
type Tab = (typeof tabs)[number]

const verdictBadge: Record<string, string> = {
  shortlist: "bg-green-100 text-green-700 ring-green-200",
  reject:    "bg-red-100 text-red-700 ring-red-200",
  flag:      "bg-amber-100 text-amber-800 ring-amber-200",
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <Star key={n} className={cn("size-4", n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
      ))}
    </span>
  )
}

// ── Schedule Interview Modal ──────────────────────────────────────────────────

interface ScheduleModalProps {
  candidateId: string
  candidateName: string
  roundNumber: number
  onClose: () => void
  onDone: (iv: Interview) => void
}

type Teacher = { id: string; full_name: string }

function ScheduleInterviewModal({ candidateId, candidateName, roundNumber, onClose, onDone }: ScheduleModalProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
  const [platform, setPlatform] = useState("Google Meet")
  const [meetingLink, setMeetingLink] = useState("")
  const [startDate, setStartDate] = useState("")
  const [duration, setDuration] = useState("60")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/users/`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json())
      .then((data: any[]) => setTeachers(data.filter((u: any) => u.roles?.includes("teacher"))))
      .catch(() => {})
  }, [])

  function toggleTeacher(id: string) {
    setSelectedTeachers((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])
  }

  async function handleSubmit() {
    if (!startDate) { setError("Please select a date and time."); return }
    setError(null); setSubmitting(true)
    try {
      const start = new Date(startDate)
      const end   = new Date(start.getTime() + Number(duration) * 60000)
      const res = await fetch(`${API_URL}/interviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          candidate_id: candidateId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          timezone: "Asia/Kolkata",
          meeting_platform: platform,
          meeting_link: meetingLink || null,
          notes: notes || null,
          participants: selectedTeachers.map((id) => ({ user_id: id, role: "co_interviewer" })),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as any).detail ?? "Failed to schedule."); return
      }
      const data = await res.json()
      setDone(true)
      const iv: Interview = {
        id: data.id, candidate: candidateName, round: roundNumber,
        status: "scheduled",
        date: start.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        time: start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        location: platform,
      }
      setTimeout(() => { onDone(iv); onClose() }, 1500)
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Schedule Interview</h2>
            <p className="text-xs text-muted-foreground">{candidateName} · Round {roundNumber}</p>
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Date & Time</label>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Duration</label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand">
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand">
                <option>Google Meet</option>
                <option>Zoom</option>
                <option>Microsoft Teams</option>
                <option>In Person</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Meeting Link (optional)</label>
              <input type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/…"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand" />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">Panel Members</label>
            <div className="max-h-36 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {teachers.map((t) => (
                <label key={t.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/40">
                  <input type="checkbox" checked={selectedTeachers.includes(t.id)} onChange={() => toggleTeacher(t.id)}
                    className="size-4 rounded border-border accent-brand" />
                  <span className="text-sm">{t.full_name}</span>
                </label>
              ))}
              {teachers.length === 0 && <p className="px-3 py-3 text-xs text-muted-foreground">No teachers found</p>}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Any instructions for the panel…"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {done
            ? <p className="flex items-center justify-center gap-2 text-sm font-medium text-green-600"><CheckCircle2 className="size-4" /> Interview scheduled!</p>
            : <button onClick={handleSubmit} disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {submitting ? "Scheduling…" : "Schedule Interview"}
              </button>
          }
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { role } = useRole()
  const [tab, setTab] = useState<Tab>("Overview")
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [status, setStatus] = useState<CvStatus>("uploaded")
  const [loading, setLoading] = useState(true)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [showSchedule, setShowSchedule] = useState(false)

  useEffect(() => {
    getCandidateById(id).then((c) => {
      if (c) { setCandidate(c); setStatus(c.status) }
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <>
      <Topbar title="Candidate Detail" />
      <div className="flex items-center justify-center p-20 text-sm text-muted-foreground">Loading candidate…</div>
    </>
  )

  if (!candidate) notFound()

  const reviews  = candidateReviews[id] ?? []
  const isAdmin  = role !== "teacher"
  const nextRound = interviews.length + 1

  const shortlisted = reviews.filter((r) => r.verdict === "shortlist").length
  const rejected    = reviews.filter((r) => r.verdict === "reject").length
  const flagged     = reviews.filter((r) => r.verdict === "flag").length
  const avgScore    = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—"

  const history = [
    { color: "bg-slate-400", label: "CV uploaded",             by: "Admin", time: candidate.uploadedOn },
    { color: "bg-blue-400",  label: "Assigned to reviewer(s)", by: "Admin", time: candidate.uploadedOn },
  ]

  return (
    <>
      <Topbar title="Candidate Detail" />
      <div className="p-6">
        <Link href="/candidates" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Candidates
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* PDF */}
          <div className="lg:col-span-2">
            <Card className="flex h-full flex-col p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">CV Preview</p>
                <button className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><Download className="size-4" /></button>
              </div>
              <p className="mb-3 truncate text-xs text-muted-foreground">{candidate.name.replace(/\s+/g,"_")}_CV.pdf</p>
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
                <div className="flex flex-col items-end gap-3">
                  {isAdmin && (
                    <select value={status} onChange={(e) => setStatus(e.target.value as CvStatus)}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
                      {(Object.keys(statusConfig) as CvStatus[]).map((s) => (
                        <option key={s} value={s}>{statusConfig[s].label}</option>
                      ))}
                    </select>
                  )}
                  <div className="flex gap-2">
                    {isAdmin && (
                      <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground hover:bg-brand/90">
                        <UserPlus className="size-4" /> Assign CV
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => { setShowSchedule(true); setTab("Interviews") }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted">
                        <CalendarPlus className="size-4" /> Schedule Interview
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-5 flex gap-1 border-b border-border">
                {tabs.map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={cn("-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                      tab === t ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground")}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="pt-5">
                {tab === "Overview" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <InfoCard label="Preferred Subject" value={candidate.subject} />
                      <InfoCard label="Experience"        value={`${candidate.experienceYears} years`} />
                      <InfoCard label="Qualification"     value={candidate.qualification} />
                      <InfoCard label="Current Employer"  value={candidate.employer} />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Notes</h3>
                        <button className="text-xs font-medium text-brand hover:underline">Edit</button>
                      </div>
                      <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">No notes yet.</p>
                    </div>
                  </div>
                )}

                {tab === "Reviews" && (
                  <div className="space-y-4">
                    {role === "teacher" && (
                      <Card className="border-brand/40 bg-brand/5 p-4">
                        <h3 className="text-sm font-semibold">Submit your review</h3>
                        <p className="mt-1 text-xs text-muted-foreground">Provide a verdict, strengths, concerns, and scores.</p>
                        <button className="mt-3 inline-flex h-8 items-center rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground hover:bg-brand/90">Open Review Form</button>
                      </Card>
                    )}
                    <p className="text-sm font-semibold">{reviews.length} reviewer{reviews.length === 1 ? "" : "s"} assigned</p>
                    {reviews.length === 0 && <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No reviews submitted yet.</p>}
                    {reviews.map((r) => (
                      <Card key={r.reviewerName} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar name={r.reviewerName} size="sm" className="bg-slate-500" />
                            <div><p className="text-sm font-medium">{r.reviewerName}</p><p className="text-xs text-muted-foreground">{r.date}</p></div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Stars value={r.rating} />
                            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset", verdictBadge[r.verdict])}>{r.verdict}</span>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-green-50 p-3"><p className="text-xs font-semibold text-green-700">Strengths</p><p className="mt-1 text-sm text-green-900/80">{r.strengths}</p></div>
                          <div className="rounded-lg bg-red-50 p-3"><p className="text-xs font-semibold text-red-700">Concerns</p><p className="mt-1 text-sm text-red-900/80">{r.concerns}</p></div>
                        </div>
                      </Card>
                    ))}
                    {reviews.length > 0 && (
                      <Card className="grid grid-cols-2 gap-3 bg-muted/40 p-4 sm:grid-cols-4">
                        <Aggregate label="Shortlisted" value={shortlisted} tone="text-green-600" />
                        <Aggregate label="Rejected"    value={rejected}   tone="text-red-600" />
                        <Aggregate label="Flagged"     value={flagged}    tone="text-amber-600" />
                        <Aggregate label="Avg Score"   value={avgScore}   tone="text-foreground" />
                      </Card>
                    )}
                  </div>
                )}

                {tab === "Interviews" && (
                  <div className="space-y-4">
                    {interviews.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No interviews scheduled yet.</p>
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
                          </Card>
                        </li>
                      ))}
                    </ol>
                    {isAdmin && (
                      <button onClick={() => setShowSchedule(true)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted">
                        <Plus className="size-4" />
                        {interviews.length === 0 ? "Schedule Interview" : "Schedule Next Round"}
                      </button>
                    )}
                  </div>
                )}

                {tab === "History" && (
                  <ol className="relative space-y-5 border-l border-border pl-6">
                    {history.map((h, i) => (
                      <li key={i} className="relative">
                        <span className={cn("absolute -left-[29px] top-1 size-3 rounded-full ring-4 ring-card", h.color)} />
                        <p className="text-sm font-medium">{h.label}</p>
                        <p className="text-xs text-muted-foreground">{h.by} · {h.time}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {showSchedule && (
        <ScheduleInterviewModal
          candidateId={id}
          candidateName={candidate.name}
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

function Aggregate({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className="text-center">
      <p className={cn("text-xl font-bold tabular-nums", tone)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
