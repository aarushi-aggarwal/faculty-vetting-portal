"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import type { Priority } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

interface Teacher { id: string; full_name: string }

/** Send one candidate's CV out to one or more teachers to scan. */
export function AssignCvModal({
  candidateId,
  candidateName,
  onClose,
  onDone,
}: {
  candidateId: string
  candidateName: string
  onClose: () => void
  onDone: () => void
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [priority, setPriority] = useState<Priority>("normal")
  const [dueDate, setDueDate] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/users/`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.json())
      .then((d: any[]) => setTeachers(d.filter((u) => u.roles?.includes("teacher"))))
      .catch(() => {})
  }, [])

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  async function submit() {
    if (selected.length === 0) {
      setError("Pick at least one teacher.")
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-md bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">Assign to Teacher</h2>
            <p className="text-xs text-muted-foreground">{candidateName}</p>
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-brand"
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
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-brand"
            />
          </div>
        </div>

        <label className="mb-2 block text-xs font-medium text-muted-foreground">
          Teachers {selected.length > 0 && `(${selected.length} selected)`}
        </label>
        <div className="mb-4 max-h-40 divide-y divide-border overflow-y-auto rounded-md border border-border">
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

        {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          onClick={submit}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Assigning…" : "Assign CV"}
        </button>
      </div>
    </div>
  )
}
