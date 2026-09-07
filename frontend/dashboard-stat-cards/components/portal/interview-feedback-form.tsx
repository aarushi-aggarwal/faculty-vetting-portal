"use client"

import { useState, useEffect } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"
function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

const outcomeOptions = [
  { value: "proceed", label: "Proceed" },
  { value: "hold", label: "Have Another Interview" },
  { value: "reject", label: "Not Proceed" },
]

interface Existing {
  outcome: string | null
  strengths: string | null
  concerns: string | null
  is_final: boolean
}

/** Interviewer's own feedback for one interview — editable until they finalize it. */
export function InterviewFeedbackForm({ interviewId, onDone }: { interviewId: string; onDone?: () => void }) {
  const [loading, setLoading] = useState(true)
  const [existing, setExisting] = useState<Existing | null>(null)
  const [outcome, setOutcome] = useState("")
  const [strengths, setStrengths] = useState("")
  const [concerns, setConcerns] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/interviews/${interviewId}/feedback/mine`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Existing | null) => {
        if (d) {
          setExisting(d)
          setOutcome(d.outcome ?? "")
          setStrengths(d.strengths ?? "")
          setConcerns(d.concerns ?? "")
        }
      })
      .finally(() => setLoading(false))
  }, [interviewId])

  async function submit() {
    if (!outcome) { setError("Pick a decision."); return }
    setSaving(true)
    setError(null)
    try {
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }
      const draft = await fetch(`${API_URL}/interviews/${interviewId}/feedback`, {
        method: "POST", headers,
        body: JSON.stringify({ outcome, strengths: strengths || null, concerns: concerns || null }),
      })
      if (!draft.ok) { setError("Could not save feedback."); return }
      const fin = await fetch(`${API_URL}/interviews/${interviewId}/feedback/submit`, { method: "POST", headers })
      if (!fin.ok) { setError("Could not finalize feedback."); return }
      setExisting({ outcome, strengths, concerns, is_final: true })
      onDone?.()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="p-3 text-xs text-muted-foreground">Loading feedback…</p>

  if (existing?.is_final) {
    return (
      <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
        <p className="flex items-center gap-1.5 font-medium text-[#2f5d40]">
          <CheckCircle2 className="size-4" /> Feedback submitted — {outcomeOptions.find((o) => o.value === existing.outcome)?.label}
        </p>
        {existing.strengths && <p className="mt-1 text-xs text-muted-foreground"><b>Strengths:</b> {existing.strengths}</p>}
        {existing.concerns && <p className="mt-1 text-xs text-muted-foreground"><b>Concerns:</b> {existing.concerns}</p>}
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border p-3">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">Your Decision</label>
      <select
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        className="mb-2 h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-brand"
      >
        <option value="">Select…</option>
        {outcomeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <textarea
        value={strengths}
        onChange={(e) => setStrengths(e.target.value)}
        rows={2}
        placeholder="Strengths (optional)"
        className="mb-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <textarea
        value={concerns}
        onChange={(e) => setConcerns(e.target.value)}
        rows={2}
        placeholder="Concerns (optional)"
        className="mb-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
      />
      {error && <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <button
        onClick={submit}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60"
      >
        {saving && <Loader2 className="size-4 animate-spin" />}
        {saving ? "Submitting…" : "Submit Feedback"}
      </button>
    </div>
  )
}
