"use client"

import { useMemo, useState } from "react"
import { Search, Clock, Video } from "lucide-react"
import { Avatar, Card } from "./ui"
import type { Interview } from "@/lib/data"

export function InterviewsClient({ interviews }: { interviews: Interview[] }) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    return interviews.filter((i) => i.candidate.toLowerCase().includes(query.toLowerCase()))
  }, [query, interviews])

  return (
    <div className="space-y-4 p-6">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by candidate..."
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.map((iv) => (
          <Card key={iv.id} className="border-l-4 border-l-blue-500 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={iv.candidate} size="sm" />
                <div>
                  <p className="font-semibold">{iv.candidate}</p>
                  <p className="text-sm text-muted-foreground">{iv.candidateEmail}</p>
                </div>
              </div>
              <div className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                {iv.status}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" />
                {iv.date} · {iv.time}
              </span>
              <span className="inline-flex items-center gap-1">
                <Video className="size-4" />
                {iv.location}
              </span>
            </div>

            <div className="mt-3 text-sm">
              <span className="text-muted-foreground">Scheduled by: </span>
              <span className="font-medium">{iv.scheduledBy}</span>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground">
            No interviews match your search.
          </Card>
        )}
      </div>
    </div>
  )
}
