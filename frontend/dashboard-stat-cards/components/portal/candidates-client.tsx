"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, ChevronRight, Archive, ArchiveRestore } from "lucide-react"
import { Avatar, Card, StatusBadge } from "./ui"
import type { Candidate, CvStatus } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

export function CandidatesClient({
  candidates,
  archivedCandidates = [],
  statusFilters,
  statusConfig,
  initialStatus = "all",
}: {
  candidates: Candidate[]
  archivedCandidates?: Candidate[]
  statusFilters: ("all" | CvStatus)[]
  statusConfig: Record<CvStatus | "all", { label: string; className: string }>
  initialStatus?: "all" | CvStatus
}) {
  const [tab, setTab] = useState<"active" | "archived">("active")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | CvStatus>(initialStatus)
  const [localActive, setLocalActive] = useState(candidates)
  const [localArchived, setLocalArchived] = useState(archivedCandidates)

  const filtered = useMemo(() => {
    const list = tab === "active" ? localActive : localArchived
    return list.filter((c) => {
      const matchesQuery =
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.subject.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = tab === "archived" || status === "all" || c.status === status
      return matchesQuery && matchesStatus
    })
  }, [query, status, tab, localActive, localArchived])

  async function archive(c: Candidate) {
    await fetch(`${API_URL}/candidates/${c.id}/archive`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    setLocalActive((prev) => prev.filter((x) => x.id !== c.id))
    setLocalArchived((prev) => [{ ...c, status: "on_hold" as CvStatus }, ...prev])
  }

  async function unarchive(c: Candidate) {
    await fetch(`${API_URL}/candidates/${c.id}/unarchive`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    setLocalArchived((prev) => prev.filter((x) => x.id !== c.id))
    setLocalActive((prev) => [{ ...c, status: "pending_assignment" as CvStatus }, ...prev])
  }

  return (
    <div className="space-y-4 p-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["active", "archived"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "active" ? `Active (${localActive.length})` : `Archived (${localArchived.length})`}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by candidate or subject..."
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        {tab === "active" && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | CvStatus)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            {statusFilters.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : statusConfig[s]?.label || s}
              </option>
            ))}
          </select>
        )}
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Candidate</th>
                <th className="px-3 py-3 font-medium">Subject</th>
                <th className="px-3 py-3 font-medium">Experience</th>
                {tab === "active" && <th className="px-3 py-3 font-medium">Status</th>}
                <th className="px-3 py-3 font-medium">Uploaded</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="group hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} size="sm" />
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{c.subject}</td>
                  <td className="px-3 py-3 text-muted-foreground">{c.experienceYears} yrs</td>
                  {tab === "active" && (
                    <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                  )}
                  <td className="px-3 py-3 text-muted-foreground">{c.uploadedOn}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {tab === "active" ? (
                        <>
                          <button
                            onClick={() => archive(c)}
                            title="Archive"
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
                          >
                            <Archive className="size-4" />
                          </button>
                          <Link href={`/candidates/${c.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                            View <ChevronRight className="size-4" />
                          </Link>
                        </>
                      ) : (
                        <button
                          onClick={() => unarchive(c)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                        >
                          <ArchiveRestore className="size-3.5" /> Unarchive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    {tab === "archived" ? "No archived candidates." : "No candidates match your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
