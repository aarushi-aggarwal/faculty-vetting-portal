"use client"

import { useState, useEffect } from "react"
import { Search, BookOpen, Loader2, CheckCircle2 } from "lucide-react"
import { Topbar } from "@/components/portal/topbar"
import { Avatar, Card, StatusBadge } from "@/components/portal/ui"
import type { Candidate } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

export default function BrowseCVsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [subject, setSubject] = useState("")
  const [requested, setRequested] = useState<Set<string>>(new Set())
  const [requesting, setRequesting] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = subject ? `?subject=${encodeURIComponent(subject)}` : ""
    fetch(`${API_URL}/candidates/available${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data: any[]) =>
        setCandidates(
          data.map((c) => ({
            id: c.id,
            name: c.full_name,
            email: c.email,
            phone: c.phone ?? "",
            subject: c.preferred_subject ?? "N/A",
            experienceYears: c.years_experience ?? 0,
            qualification: c.highest_qualification ?? "N/A",
            employer: c.current_employer ?? "N/A",
            status: (c.current_status?.toLowerCase() as any) ?? "uploaded",
            uploadedOn: new Date(c.created_at).toLocaleDateString("en-IN", {
              day: "2-digit", month: "short", year: "numeric",
            }),
          }))
        )
      )
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [subject])

  const filtered = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.subject.toLowerCase().includes(query.toLowerCase())
  )

  async function requestReview(candidateId: string) {
    setRequesting(candidateId)
    try {
      const res = await fetch(`${API_URL}/assignments/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ candidate_id: candidateId }),
      })
      if (res.ok) {
        setRequested((prev) => new Set([...prev, candidateId]))
      }
    } finally {
      setRequesting(null)
    }
  }

  const subjects = [...new Set(candidates.map((c) => c.subject).filter((s) => s !== "N/A"))].sort()

  return (
    <>
      <Topbar title="Browse CVs" subtitle="Request CVs you'd like to review" />
      <div className="space-y-4 p-6">
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or subject..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">All subjects</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="py-16 text-center text-muted-foreground">
            <BookOpen className="mx-auto mb-3 size-10 opacity-30" />
            <p className="text-sm">No available CVs at the moment.</p>
            <p className="mt-1 text-xs">Check back later or try a different subject filter.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const isRequested = requested.has(c.id)
              const isRequesting = requesting === c.id
              return (
                <Card key={c.id} className="flex flex-col p-5">
                  <div className="flex items-start gap-3">
                    <Avatar name={c.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.subject}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md bg-muted/50 px-2.5 py-2">
                      <p className="text-muted-foreground">Experience</p>
                      <p className="font-medium">{c.experienceYears} yrs</p>
                    </div>
                    <div className="rounded-md bg-muted/50 px-2.5 py-2">
                      <p className="text-muted-foreground">Qualification</p>
                      <p className="font-medium">{c.qualification}</p>
                    </div>
                    <div className="col-span-2 rounded-md bg-muted/50 px-2.5 py-2">
                      <p className="text-muted-foreground">Current Employer</p>
                      <p className="font-medium">{c.employer}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    {isRequested ? (
                      <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-2 text-sm font-medium text-green-700">
                        <CheckCircle2 className="size-4" /> Request sent
                      </div>
                    ) : (
                      <button
                        onClick={() => requestReview(c.id)}
                        disabled={isRequesting}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60"
                      >
                        {isRequesting && <Loader2 className="size-4 animate-spin" />}
                        {isRequesting ? "Requesting…" : "Request to Review"}
                      </button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
