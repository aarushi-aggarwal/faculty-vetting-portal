"use client"

import { useState, useEffect } from "react"
import { X, Loader2, CheckCircle2 } from "lucide-react"
import type { Candidate, Interview } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

type Teacher = { id: string; full_name: string }

const shortDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })

/**
 * Admin schedules an interview panel for a shortlisted candidate.
 * Pass `candidate` to pin it to one person, or `candidates` to let the admin pick.
 */
export function ScheduleInterviewModal({
  candidate,
  candidates,
  roundNumber = 1,
  onClose,
  onDone,
}: {
  candidate?: { id: string; name: string }
  candidates?: Candidate[]
  roundNumber?: number
  onClose: () => void
  onDone?: (iv: Interview) => void
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [candidateId, setCandidateId] = useState(candidate?.id ?? "")
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
  const [platform, setPlatform] = useState("Google Meet")
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
    setSelectedTeachers((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  const chosenName =
    candidate?.name ?? candidates?.find((c) => c.id === candidateId)?.name ?? ""

  async function handleSubmit() {
    if (!candidateId) { setError("Please pick a candidate."); return }
    if (!startDate) { setError("Please select a date and time."); return }
    if (selectedTeachers.length === 0) { setError("Please pick at least one panel member."); return }

    setError(null)
    setSubmitting(true)
    try {
      const start = new Date(startDate)
      const end = new Date(start.getTime() + Number(duration) * 60000)
      const res = await fetch(`${API_URL}/interviews/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          candidate_id: candidateId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          timezone: "Asia/Kolkata",
          meeting_platform: platform,
          notes: notes || null,
          participants: selectedTeachers.map((id) => ({ user_id: id, role: "co_interviewer" })),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as any).detail ?? "Failed to schedule.")
        return
      }
      const data = await res.json()
      setDone(true)
      const iv: Interview = {
        id: data.id,
        candidate: chosenName,
        round: data.round_number ?? roundNumber,
        status: "scheduled",
        date: shortDate(start),
        time: start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        location: platform,
        interviewers: selectedTeachers.map((id) => ({
          name: teachers.find((t) => t.id === id)?.full_name ?? "",
          role: "Co-interviewer" as const,
        })),
      }
      setTimeout(() => { onDone?.(iv); onClose() }, 1200)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">Schedule Interview</h2>
            <p className="text-xs text-muted-foreground">
              {candidate ? `${candidate.name} · Round ${roundNumber}` : "Pick a shortlisted candidate and a panel"}
            </p>
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4">
          {!candidate && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Candidate</label>
              <select
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
              >
                <option value="">Select a candidate…</option>
                {(candidates ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.subject}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Date & Time</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
            >
              <option>Google Meet</option>
              <option>Zoom</option>
              <option>Microsoft Teams</option>
              <option>In Person</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Panel Members {selectedTeachers.length > 0 && `(${selectedTeachers.length} selected)`}
            </label>
            <div className="max-h-36 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {teachers.map((t) => (
                <label key={t.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/40">
                  <input
                    type="checkbox"
                    checked={selectedTeachers.includes(t.id)}
                    onChange={() => toggleTeacher(t.id)}
                    className="size-4 rounded border-border accent-brand"
                  />
                  <span className="text-sm">{t.full_name}</span>
                </label>
              ))}
              {teachers.length === 0 && <p className="px-3 py-3 text-xs text-muted-foreground">No teachers found</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any instructions for the panel…"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          {done ? (
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-green-600">
              <CheckCircle2 className="size-4" /> Interview scheduled
            </p>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Scheduling…" : "Schedule Interview"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
