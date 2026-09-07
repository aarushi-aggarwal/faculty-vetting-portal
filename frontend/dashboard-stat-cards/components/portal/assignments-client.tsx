"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, X, RefreshCw, UserPlus, Plus, Loader2 } from "lucide-react"
import {
  Avatar, AssignmentStatusBadge, Card, PriorityBadge, VerdictBadge, AdminActionBadge,
} from "./ui"
import { cn } from "@/lib/utils"
import { initials } from "@/lib/badges"
import type { Assignment, AssignmentStatus, Candidate, Priority } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

interface Teacher { id: string; full_name: string }

function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  useEffect(() => {
    fetch(`${API_URL}/users/`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json())
      .then((d: any[]) => setTeachers(d.filter((u) => u.roles?.includes("teacher"))))
      .catch(() => {})
  }, [])
  return teachers
}

function Modal({ title, subtitle, children, onClose }: {
  title: string
  subtitle?: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Assign a candidate's CV to one or more teachers to scan ────────────────────

function AssignModal({
  candidates,
  teachers,
  onClose,
  onDone,
}: {
  candidates: Candidate[]
  teachers: Teacher[]
  onClose: () => void
  onDone: () => void
}) {
  const [candidateId, setCandidateId] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [priority, setPriority] = useState<Priority>("normal")
  const [dueDate, setDueDate] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  async function submit() {
    if (!candidateId || selected.length === 0) {
      setError("Pick a candidate and at least one teacher.")
      return
    }
    setError(null)
    setSaving(true)
    try {
      const results = await Promise.all(
        selected.map((teacherId) =>
          fetch(`${API_URL}/assignments/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({
              candidate_id: candidateId,
              teacher_id: teacherId,
              priority,
              due_date: dueDate || null,
            }),
          }),
        ),
      )
      const failed = results.filter((r) => !r.ok)
      if (failed.length === results.length) {
        const d = await failed[0].json().catch(() => ({}))
        setError((d as any).detail ?? "Could not assign this CV.")
        return
      }
      onDone()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Assign CV" subtitle="Send a CV out to teachers to scan and shortlist" onClose={onClose}>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">Candidate</label>
      <select
        value={candidateId}
        onChange={(e) => setCandidateId(e.target.value)}
        className="mb-3 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
      >
        <option value="">Select a candidate…</option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>{c.name} — {c.subject}</option>
        ))}
      </select>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
          >
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      <label className="mb-2 block text-xs font-medium text-muted-foreground">
        Teachers {selected.length > 0 && `(${selected.length} selected)`}
      </label>
      <div className="mb-4 max-h-40 divide-y divide-border overflow-y-auto rounded-lg border border-border">
        {teachers.map((t) => (
          <label key={t.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/40">
            <input
              type="checkbox"
              checked={selected.includes(t.id)}
              onChange={() => toggle(t.id)}
              className="size-4 rounded border-border accent-brand"
            />
            <span className="text-sm">{t.full_name}</span>
          </label>
        ))}
        {teachers.length === 0 && <p className="px-3 py-3 text-xs text-muted-foreground">No teachers found</p>}
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        onClick={submit}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60"
      >
        {saving && <Loader2 className="size-4 animate-spin" />}
        {saving ? "Assigning…" : "Assign CV"}
      </button>
    </Modal>
  )
}

// ── Assignments table ──────────────────────────────────────────────────────────

export function AssignmentsClient({
  assignments,
  candidates,
  initialStatus = "all",
}: {
  assignments: Assignment[]
  candidates: Candidate[]
  initialStatus?: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | AssignmentStatus>(initialStatus as "all" | AssignmentStatus)
  const [selected, setSelected] = useState<Assignment | null>(null)
  const [modal, setModal] = useState<"assign" | "reassign" | "add-reviewer" | null>(null)
  const [localAssignments, setLocalAssignments] = useState(assignments)
  const teachers = useTeachers()

  const [reassignTeacher, setReassignTeacher] = useState("")
  const [reassignReason, setReassignReason] = useState("")
  const [reassigning, setReassigning] = useState(false)
  const [reassignDone, setReassignDone] = useState(false)
  const [reviewerTeacher, setReviewerTeacher] = useState("")
  const [addingReviewer, setAddingReviewer] = useState(false)
  const [reviewerDone, setReviewerDone] = useState(false)

  useEffect(() => setLocalAssignments(assignments), [assignments])

  const filtered = useMemo(() => {
    return localAssignments.filter((a) => {
      const q = query.toLowerCase()
      const matchesQuery =
        a.candidate.toLowerCase().includes(q) || a.teachers.some((t) => t.toLowerCase().includes(q))
      const matchesStatus = status === "all" || a.status === status
      return matchesQuery && matchesStatus
    })
  }, [query, status, localAssignments])

  const stats = [
    { label: "Pending",   value: localAssignments.filter((a) => a.status === "pending").length,   tone: "yellow" },
    { label: "In Review", value: localAssignments.filter((a) => a.status === "in_review").length, tone: "purple" },
    { label: "Scanned",   value: localAssignments.filter((a) => a.status === "completed").length, tone: "green" },
  ]
  const statTone: Record<string, string> = { yellow: "text-amber-600", purple: "text-purple-600", green: "text-green-600" }

  function openModal(type: "reassign" | "add-reviewer") {
    setModal(type)
    setReassignTeacher(""); setReassignReason(""); setReassignDone(false)
    setReviewerTeacher(""); setReviewerDone(false)
  }

  async function handleReassign() {
    if (!selected || !reassignTeacher) return
    setReassigning(true)
    try {
      const res = await fetch(`${API_URL}/assignments/${selected.id}/reassign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ new_teacher_id: reassignTeacher, reason: reassignReason }),
      })
      if (res.ok) {
        setReassignDone(true)
        setTimeout(() => { setModal(null); setSelected(null); router.refresh() }, 1200)
      }
    } finally { setReassigning(false) }
  }

  async function handleAddReviewer() {
    if (!selected || !reviewerTeacher || !selected.candidateId) return
    setAddingReviewer(true)
    try {
      const res = await fetch(`${API_URL}/assignments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          candidate_id: selected.candidateId,
          teacher_id: reviewerTeacher,
          priority: selected.priority,
        }),
      })
      if (res.ok) {
        setReviewerDone(true)
        setTimeout(() => { setModal(null); setSelected(null); router.refresh() }, 1200)
      }
    } finally { setAddingReviewer(false) }
  }

  return (
    <>
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="grid flex-1 grid-cols-3 gap-4">
            {stats.map((s) => (
              <Card key={s.label} className="p-4">
                <p className={cn("text-2xl font-bold tabular-nums", statTone[s.tone])}>{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>
          <button
            onClick={() => setModal("assign")}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="size-4" /> Assign CV
          </button>
        </div>

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
            <option value="completed">Scanned</option>
          </select>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Candidate</th>
                  <th className="px-3 py-3 font-medium">Assigned To</th>
                  <th className="px-3 py-3 font-medium">Priority</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Outcome</th>
                  <th className="px-5 py-3 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((a) => (
                  <tr key={a.id} onClick={() => setSelected(a)} className="cursor-pointer hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <p className="font-medium">{a.candidate}</p>
                      <p className="text-xs text-muted-foreground">{a.subject}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-full bg-slate-500 text-xs font-semibold text-white">
                          {initials(a.teachers[0] ?? "")}
                        </span>
                        <span className="text-xs text-muted-foreground">{a.teachers[0]}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3"><PriorityBadge priority={a.priority} /></td>
                    <td className="px-3 py-3"><AssignmentStatusBadge status={a.status} /></td>
                    <td className="px-3 py-3">
                      {a.verdict ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <VerdictBadge verdict={a.verdict} />
                          {a.adminAction
                            ? <AdminActionBadge action={a.adminAction} />
                            : <span className="text-xs text-muted-foreground">awaiting admin</span>}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(a.overdue ? "font-semibold text-red-600" : "text-muted-foreground")}>{a.dueDate}</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                      No assignments match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
            Showing {filtered.length} of {localAssignments.length}
          </div>
        </Card>
      </div>

      {/* Slide-in detail */}
      {selected && !modal && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <aside className="absolute right-0 top-0 flex h-full w-[380px] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">Assignment Detail</h2>
              <button onClick={() => setSelected(null)} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
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
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assigned To</p>
                <ul className="space-y-2">
                  {selected.teachers.map((t) => (
                    <li key={t} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                      <Avatar name={t} size="sm" />
                      <p className="text-sm font-medium">{t}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</p>
                <ol className="relative space-y-3 border-l border-border pl-5 text-sm">
                  <li className="relative">
                    <span className="absolute -left-[23px] top-1 size-2.5 rounded-full bg-blue-400 ring-4 ring-card" />
                    Assigned on {selected.assignedDate}
                  </li>
                  <li className="relative">
                    <span className="absolute -left-[23px] top-1 size-2.5 rounded-full bg-purple-400 ring-4 ring-card" />
                    Due {selected.dueDate}
                  </li>
                  {selected.completedDate && (
                    <li className="relative">
                      <span className="absolute -left-[23px] top-1 size-2.5 rounded-full bg-green-500 ring-4 ring-card" />
                      Scanned on {selected.completedDate}
                      {selected.verdict && ` — ${selected.verdict === "shortlist" ? "shortlisted" : "not shortlisted"}`}
                    </li>
                  )}
                </ol>
              </div>
            </div>
            {selected.status !== "completed" && (
              <div className="flex gap-2 border-t border-border p-4">
                <button onClick={() => openModal("reassign")} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand text-sm font-medium text-brand-foreground hover:bg-brand/90">
                  <RefreshCw className="size-4" /> Reassign
                </button>
                <button onClick={() => openModal("add-reviewer")} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted">
                  <UserPlus className="size-4" /> Add Teacher
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {modal === "assign" && (
        <AssignModal
          candidates={candidates}
          teachers={teachers}
          onClose={() => setModal(null)}
          onDone={() => router.refresh()}
        />
      )}

      {modal === "reassign" && selected && (
        <Modal title="Reassign" subtitle={selected.candidate} onClose={() => setModal(null)}>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">New Teacher</label>
          <select value={reassignTeacher} onChange={(e) => setReassignTeacher(e.target.value)} className="mb-3 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand">
            <option value="">Select a teacher…</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Reason (optional)</label>
          <textarea value={reassignReason} onChange={(e) => setReassignReason(e.target.value)} rows={3} placeholder="Why is this being reassigned?" className="mb-4 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand" />
          {reassignDone
            ? <p className="text-center text-sm font-medium text-green-600">✓ Reassigned</p>
            : <button onClick={handleReassign} disabled={!reassignTeacher || reassigning} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60">
                {reassigning && <Loader2 className="size-4 animate-spin" />}{reassigning ? "Reassigning…" : "Confirm Reassign"}
              </button>
          }
        </Modal>
      )}

      {modal === "add-reviewer" && selected && (
        <Modal title="Add Teacher" subtitle={`Another teacher to scan ${selected.candidate}`} onClose={() => setModal(null)}>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Select Teacher</label>
          <select value={reviewerTeacher} onChange={(e) => setReviewerTeacher(e.target.value)} className="mb-4 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand">
            <option value="">Select a teacher…</option>
            {teachers.filter((t) => !selected.teachers.includes(t.full_name)).map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
          {reviewerDone
            ? <p className="text-center text-sm font-medium text-green-600">✓ Teacher added</p>
            : <button onClick={handleAddReviewer} disabled={!reviewerTeacher || addingReviewer} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60">
                {addingReviewer && <Loader2 className="size-4 animate-spin" />}{addingReviewer ? "Adding…" : "Add Teacher"}
              </button>
          }
        </Modal>
      )}
    </>
  )
}
