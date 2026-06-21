"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, ChevronRight } from "lucide-react"
import { Avatar, Card, StatusBadge } from "./ui"
import type { Candidate, CvStatus } from "@/lib/data"

export function CandidatesClient({
  candidates,
  statusFilters,
  statusConfig,
}: {
  candidates: Candidate[]
  statusFilters: ("all" | CvStatus)[]
  statusConfig: Record<CvStatus | "all", { label: string; className: string }>
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | CvStatus>("all")

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      const matchesQuery =
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.subject.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === "all" || c.status === status
      return matchesQuery && matchesStatus
    })
  }, [query, status, candidates])

  return (
    <div className="space-y-4 p-6">
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
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Candidate</th>
                <th className="px-3 py-3 font-medium">Subject</th>
                <th className="px-3 py-3 font-medium">Experience</th>
                <th className="px-3 py-3 font-medium">Status</th>
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
                  <td className="px-3 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{c.uploadedOn}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/candidates/${c.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                    >
                      View
                      <ChevronRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    No candidates match your filters.
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
