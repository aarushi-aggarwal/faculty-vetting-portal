"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, Undo2, Loader2, X, ArrowRight, FileText } from "lucide-react"
import { Avatar, Card, VerdictBadge } from "./ui"
import { cn } from "@/lib/utils"
import type { AdminAction, PendingReview, Verdict } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

/** Accepting follows the teacher; overriding inverts them. Mirrors the backend rule. */
function outcomeOf(verdict: Verdict, action: AdminAction): "interview" | "archive" {
  const shortlisted = action === "overridden" ? verdict !== "shortlist" : verdict === "shortlist"
  return shortlisted ? "interview" : "archive"
}

const outcomeCopy = {
  interview: { label: "Goes to interview scheduling", className: "text-[#2f5d40]" },
  archive:   { label: "Goes to the archive", className: "text-[#5f5954]" },
}

function ConfirmDialog({
  review,
  action,
  onClose,
  onDone,
}: {
  review: PendingReview
  action: AdminAction
  onClose: () => void
  onDone: () => void
}) {
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const outcome = outcomeOf(review.verdict, action)

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/reviews/${review.reviewId}/admin-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ action, note: note || null }),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-md bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">
              {action === "accepted" ? "Accept this decision" : "Override this decision"}
            </h2>
            <p className="text-xs text-muted-foreground">{review.candidate} · {review.subject}</p>
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-4 rounded-md border border-border bg-muted/40 p-3 text-sm">
          <p className="text-muted-foreground">
            {review.teacher} said <strong className="text-foreground">
              {review.verdict === "shortlist" ? "shortlist" : "do not shortlist"}
            </strong>.
          </p>
          <p className="mt-2 flex items-center gap-1.5 font-medium">
            <ArrowRight className="size-4 shrink-0" />
            <span className={outcomeCopy[outcome].className}>{outcomeCopy[outcome].label}</span>
          </p>
        </div>

        <label className="mb-1 block text-xs font-medium text-muted-foreground">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={action === "overridden" ? "Why are you overriding this?" : "Anything to add?"}
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

export function ReviewsClient({ reviews }: { reviews: PendingReview[] }) {
  const router = useRouter()
  const [pending, setPending] = useState<{ review: PendingReview; action: AdminAction } | null>(null)

  if (reviews.length === 0) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <FileText className="mx-auto mb-3 size-10 text-muted-foreground/30" />
          <p className="text-sm font-medium">Nothing waiting on you</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Teacher verdicts appear here as soon as they finish scanning a CV.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 p-6">
        {reviews.map((r) => {
          const accepted = outcomeOf(r.verdict, "accepted")
          const overridden = outcomeOf(r.verdict, "overridden")
          return (
            <Card key={r.reviewId} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={r.candidate} size="md" />
                  <div>
                    <Link href={`/candidates/${r.candidateId}`} className="font-semibold hover:text-brand hover:underline">
                      {r.candidate}
                    </Link>
                    <p className="text-sm text-muted-foreground">{r.subject}</p>
                  </div>
                </div>
                <div className="text-right">
                  <VerdictBadge verdict={r.verdict} />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    by {r.teacher} · {r.submittedOn}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-border bg-muted/40 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Teacher's reasoning
                </p>
                <p className="text-sm">{r.reasoning || <span className="text-muted-foreground">No reasoning given.</span>}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setPending({ review: r, action: "accepted" })}
                  className="inline-flex flex-1 min-w-[220px] items-center gap-2.5 rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:border-brand hover:bg-muted/40"
                >
                  <Check className="size-4 shrink-0 text-[#2f5d40]" />
                  <span>
                    <span className="block text-sm font-medium">Accept decision</span>
                    <span className={cn("block text-xs", outcomeCopy[accepted].className)}>
                      {outcomeCopy[accepted].label}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => setPending({ review: r, action: "overridden" })}
                  className="inline-flex flex-1 min-w-[220px] items-center gap-2.5 rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:border-brand hover:bg-muted/40"
                >
                  <Undo2 className="size-4 shrink-0 text-[#7a5c1e]" />
                  <span>
                    <span className="block text-sm font-medium">Override decision</span>
                    <span className={cn("block text-xs", outcomeCopy[overridden].className)}>
                      {outcomeCopy[overridden].label}
                    </span>
                  </span>
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      {pending && (
        <ConfirmDialog
          review={pending.review}
          action={pending.action}
          onClose={() => setPending(null)}
          onDone={() => router.refresh()}
        />
      )}
    </>
  )
}
