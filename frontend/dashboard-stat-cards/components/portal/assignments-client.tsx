"use client"

import { useMemo, useState, useEffect } from "react"
import { Search, X, RefreshCw, UserPlus, AlertTriangle, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Avatar, AssignmentStatusBadge, Card, PriorityBadge } from "./ui"
import { cn } from "@/lib/utils"
import { initials } from "@/lib/badges"
import type { Assignment, AssignmentStatus } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

interface Teacher { id: string; full_name: string }
interface Request { id: string; candidate_name: string; candidate_subject: string | null; teacher_name: string; assigned_at: string; priority: string }

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

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function AssignmentsClient({
  assignments,
  initialStatus = "all",
}: {
  assignments: Assignment[]
  initialStatus?: string
}) {
  const [tab, setTab] = useState<"assignments" | "requests">("assignments")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | AssignmentStatus>(initialStatus as "all" | AssignmentStatus)
  const [selected, setSelected] = useState<Assignment | null>(null)
  const [modal, setModal] = useState<"reassign" | "add-reviewer" | null>(null)
  const [localAssignments, setLocalAssignments] = useState(assignments)
  const teachers = useTeachers()

  // Requests tab state
  const [requests, setRequests] = useState<Request[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const [reassignTeacher, setReassignTeacher] = useState("")
  const [reassignReason, setReassignReason] = useState("")
  const [reassigning, setReassigning] = useState(false)
  const [reassignDone, setReassignDone] = useState(false)
  const [reviewerTeacher, setReviewerTeacher] = useState("")
  const [addingReviewer, setAddingReviewer] = useState(false)
  const [reviewerDone, setReviewerDone] = useState(false)

  useEffect(() => {
    if (tab === "requests") {
      setLoadingRequests(true)
      fetch(`${API_URL}/assignments/requests`, { headers: { Authorization: `Bearer ${getToken()}` } })
        .then((r) => r.json())
        .then((d: any[]) => setRequests(d.map((r) => ({
          id: r.id, candidate_name: r.candidate_name, candidate_subject: r.candidate_subject,
          teacher_name: r.teacher_name, assigned_at: r.assigned_at, priority: r.priority,
        }))))
        .catch(() => {})
        .finally(() => setLoadingRequests(false))
    }
  }, [tab])

  async function approveRequest(id: string) {
    setActionId(id)
    await fetch(`${API_URL}/assignments/${id}/approve`, { method: "PATCH", headers: { Authorization: `Bearer ${getToken()}` } })
    setRequests((prev) => prev.filter((r) => r.id !== id))
    setActionId(null)
  }

  async function declineRequest(id: string) {
    setActionId(id)
    await fetch(`${API_URL}/assignments/${id}/decline-request`, {
      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ reason: "Declined by admin" }),
    })
    setRequests((prev) => prev.filter((r) => r.id !== id))
    setActionId(null)
  }

  const filtered = useMemo(() => {
    return localAssignments.filter((a) => {
      const q = query.toLowerCase()
      const matchesQuery = a.candidate.toLowerCase().includes(q) || a.teachers.some((t) => t.toLowerCase().includes(q))
      const matchesStatus = status === "all" || a.status === status
      return matchesQuery && matchesStatus
    })
  }, [query, status, localAssignments])

  const stats = [
    { label: "Pending",   value: localAssignments.filter((a) => a.status === "pending").length,   tone: "yellow" },
    { label: "In Review", value: localAssignments.filter((a) => a.status === "in_review").length, tone: "purple" },
    { label: "Completed", value: localAssignments.filter((a) => a.status === "completed").length, tone: "green" },
  ]
  const statTone: Record<string, string> = { yellow: "text-amber-600", purple: "text-purple-600", green: "text-green-600" }

  function openModal(type: "reassign" | "add-reviewer") {
    setModal(type); setReassignTeacher(""); setReassignReason(""); setReassignDone(false)
    setReviewerTeacher(""); setReviewerDone(false)
  }

  async function handleReassign() {
    if (!selected || !reassignTeacher) return
    setReassigning(true)
    try {
      const res = await fetch(`${API_URL}/assignments/${selected.id}/reassign`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ new_teacher_id: reassignTeacher, reason: reassignReason }),
      })
      if (res.ok) {
        setReassignDone(true)
        const teacher = teachers.find((t) => t.id === reassignTeacher)
        setLocalAssignments((prev) => prev.map((a) =>
          a.id === selected.id ? { ...a, teachers: teacher ? [teacher.full_name] : a.teachers } : a
        ))
        setTimeout(() => { setModal(null); setSelected(null) }, 1500)
      }
    } finally { setReassigning(false) }
  }

  async function handleAddReviewer() {
    if (!selected || !reviewerTeacher || !selected.candidateId) return
    setAddingReviewer(true)
    try {
      const res = await fetch(`${API_URL}/assignments/`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ cv_id: selected.id, candidate_id: selected.candidateId, teacher_id: reviewerTeacher, priority: selected.priority }),
      })
      if (res.ok) {
        setReviewerDone(true)
        const teacher = teachers.find((t) => t.id === reviewerTeacher)
        if (teacher) setLocalAssignments((prev) => prev.map((a) =>
          a.id === selected.id ? { ...a, teachers: [...a.teachers, teacher.full_name] } : a
        ))
        setTimeout(() => setModal(null), 1500)
      }
    } finally { setAddingReviewer(false) }
  }

  return (
    <>
      <div className="space-y-4 p-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["assignments", "requests"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors capitalize ${
                tab === t ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t === "requests" ? `Requests${requests.length > 0 ? ` (${requests.length})` : ""}` : "Assignments"}
            </button>
          ))}
        </div>

        {tab === "assignments" && (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {stats.map((s) => (
                <Card key={s.label} className="p-4">
                  <p className={cn("text-2xl font-bold tabular-nums", statTone[s.tone])}>{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </Card>
              ))}
            </div>

            <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by candidate or teacher..."
                  className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
              </div>
              <select value={status} onChange={(e) => setStatus(e.target.value as "all" | AssignmentStatus)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
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
                      <th className="px-3 py-3 font-medium">Due Date</th>
                      <th className="px-5 py-3 font-medium">Assigned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((a) => (
                      <tr key={a.id} onClick={() => setSelected(a)} className={cn("cursor-pointer hover:bg-muted/40", a.status === "declined" && "bg-red-50/50")}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {a.status === "declined" && <AlertTriangle className="size-4 text-red-500" />}
                            <div><p className="font-medium">{a.candidate}</p><p className="text-xs text-muted-foreground">{a.subject}</p></div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center">
                            <div className="flex -space-x-2">
                              {a.teachers.slice(0, 3).map((t) => (
                                <span key={t} title={t} className="flex size-7 items-center justify-center rounded-full bg-slate-500 text-xs font-semibold text-white ring-2 ring-card">{initials(t)}</span>
                              ))}
                            </div>
                            <span className="ml-2 text-xs text-muted-foreground">{a.teachers.length === 1 ? a.teachers[0] : `${a.teachers.length} reviewers`}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3"><PriorityBadge priority={a.priority} /></td>
                        <td className="px-3 py-3"><AssignmentStatusBadge status={a.status} /></td>
                        <td className="px-3 py-3"><span className={cn(a.overdue ? "font-semibold text-red-600" : "text-muted-foreground")}>{a.dueDate}</span></td>
                        <td className="px-5 py-3 text-muted-foreground">{a.assignedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm text-muted-foreground">
                <span>Showing {filtered.length} of {localAssignments.length}</span>
              </div>
            </Card>
          </>
        )}

        {tab === "requests" && (
          <Card className="overflow-hidden">
            {loadingRequests ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
            ) : requests.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No pending review requests.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Candidate</th>
                      <th className="px-3 py-3 font-medium">Requested By</th>
                      <th className="px-3 py-3 font-medium">Requested At</th>
                      <th className="px-5 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {requests.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/40">
                        <td className="px-5 py-3">
                          <p className="font-medium">{r.candidate_name}</p>
                          <p className="text-xs text-muted-foreground">{r.candidate_subject ?? "N/A"}</p>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={r.teacher_name} size="sm" />
                            <span>{r.teacher_name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {new Date(r.assigned_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => approveRequest(r.id)} disabled={actionId === r.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60">
                              {actionId === r.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                              Approve
                            </button>
                            <button onClick={() => declineRequest(r.id)} disabled={actionId === r.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60">
                              {actionId === r.id ? <Loader2 className="size-3 animate-spin" /> : <XCircle className="size-3.5" />}
                              Decline
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Slide-in detail */}
      {selected && !modal && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <aside className="absolute right-0 top-0 flex h-full w-[380px] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">Assignment Detail</h2>
              <button onClick={() => setSelected(null)} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div>
                <p className="text-lg font-semibold">{selected.candidate}</p>
                <p className="text-sm text-muted-foreground">{selected.subject}</p>
                <div className="mt-2 flex gap-2"><PriorityBadge priority={selected.priority} /><AssignmentStatusBadge status={selected.status} /></div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assigned Teachers</p>
                <ul className="space-y-2">
                  {selected.teachers.map((t) => (
                    <li key={t} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                      <Avatar name={t} size="sm" />
                      <div className="flex-1"><p className="text-sm font-medium">{t}</p></div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</p>
                <ol className="relative space-y-3 border-l border-border pl-5 text-sm">
                  <li className="relative"><span className="absolute -left-[23px] top-1 size-2.5 rounded-full bg-blue-400 ring-4 ring-card" />Assigned on {selected.assignedDate}</li>
                  <li className="relative"><span className="absolute -left-[23px] top-1 size-2.5 rounded-full bg-purple-400 ring-4 ring-card" />Due {selected.dueDate}</li>
                </ol>
              </div>
            </div>
            <div className="flex gap-2 border-t border-border p-4">
              <button onClick={() => openModal("reassign")} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand text-sm font-medium text-brand-foreground hover:bg-brand/90">
                <RefreshCw className="size-4" /> Reassign
              </button>
              <button onClick={() => openModal("add-reviewer")} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted">
                <UserPlus className="size-4" /> Add Reviewer
              </button>
            </div>
          </aside>
        </div>
      )}

      {modal === "reassign" && selected && (
        <Modal title="Reassign Assignment" onClose={() => setModal(null)}>
          <p className="mb-4 text-sm text-muted-foreground">Reassigning <strong>{selected.candidate}</strong> to a new reviewer.</p>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">New Reviewer</label>
          <select value={reassignTeacher} onChange={(e) => setReassignTeacher(e.target.value)} className="mb-3 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand">
            <option value="">Select a teacher…</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Reason (optional)</label>
          <textarea value={reassignReason} onChange={(e) => setReassignReason(e.target.value)} rows={3} placeholder="Why is this being reassigned?" className="mb-4 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand" />
          {reassignDone
            ? <p className="text-center text-sm font-medium text-green-600">✓ Reassigned successfully</p>
            : <button onClick={handleReassign} disabled={!reassignTeacher || reassigning} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60">
                {reassigning && <Loader2 className="size-4 animate-spin" />}{reassigning ? "Reassigning…" : "Confirm Reassign"}
              </button>
          }
        </Modal>
      )}

      {modal === "add-reviewer" && selected && (
        <Modal title="Add Reviewer" onClose={() => setModal(null)}>
          <p className="mb-4 text-sm text-muted-foreground">Add another reviewer for <strong>{selected.candidate}</strong>.</p>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Select Teacher</label>
          <select value={reviewerTeacher} onChange={(e) => setReviewerTeacher(e.target.value)} className="mb-4 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand">
            <option value="">Select a teacher…</option>
            {teachers.filter((t) => !selected.teachers.includes(t.full_name)).map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
          {reviewerDone
            ? <p className="text-center text-sm font-medium text-green-600">✓ Reviewer added</p>
            : <button onClick={handleAddReviewer} disabled={!reviewerTeacher || addingReviewer} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60">
                {addingReviewer && <Loader2 className="size-4 animate-spin" />}{addingReviewer ? "Adding…" : "Add Reviewer"}
              </button>
          }
        </Modal>
      )}
    </>
  )
}
