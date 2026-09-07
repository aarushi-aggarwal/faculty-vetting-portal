"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Avatar, Card, StatusBadge, ActionNeededBadge } from "./ui"
import { CandidatePanel } from "./candidate-panel"
import { useSortableRows, SortableTh } from "./sortable"
import { cn } from "@/lib/utils"
import { statusConfig } from "@/lib/badges"
import type { CandidateBoardRow, CvStatus } from "@/lib/data"

type SortKey = "name" | "subject" | "status" | "updatedAt"
type PanelTab = "Profile" | "Reviews" | "Interviews"

const tabParam: Record<string, PanelTab> = {
  profile: "Profile", reviews: "Reviews", interviews: "Interviews",
}

export function CandidatesClient({ candidates }: { candidates: CandidateBoardRow[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | CvStatus>(
    (searchParams.get("status") as CvStatus) || "all",
  )
  const [actionOnly, setActionOnly] = useState(searchParams.get("actionRequired") === "1")
  const [rows, setRows] = useState(candidates)
  const [panel, setPanel] = useState<{ id: string; tab: PanelTab } | null>(null)

  useEffect(() => setRows(candidates), [candidates])

  // Deep-link support: dashboard cards link here with ?open=<id>&tab=reviews.
  useEffect(() => {
    const open = searchParams.get("open")
    if (open) {
      const tab = tabParam[searchParams.get("tab") ?? ""] ?? "Profile"
      setPanel({ id: open, tab })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    return rows.filter((c) => {
      const q = query.toLowerCase()
      const matchesQuery = c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q)
      const matchesStatus = status === "all" || c.status === status
      const matchesAction = !actionOnly || c.actionHighlight
      return matchesQuery && matchesStatus && matchesAction
    })
  }, [rows, query, status, actionOnly])

  const { sorted, sortKey, sortDir, toggleSort } = useSortableRows<CandidateBoardRow, SortKey>(
    filtered,
    {
      name: (r) => r.name.toLowerCase(),
      subject: (r) => r.subject.toLowerCase(),
      status: (r) => r.status,
      updatedAt: (r) => new Date(r.updatedAt),
    },
    { key: "updatedAt", dir: "desc" },
  )

  function openPanel(id: string) {
    setPanel({ id, tab: "Profile" })
  }

  function closePanel() {
    setPanel(null)
    if (searchParams.get("open")) router.replace("/candidates")
  }

  function onChanged() {
    router.refresh()
  }

  return (
    <>
      <div className="space-y-4 p-6">
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or subject..."
              className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | CvStatus)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="all">All statuses</option>
            {(Object.keys(statusConfig) as CvStatus[]).map((s) => (
              <option key={s} value={s}>{statusConfig[s].label}</option>
            ))}
          </select>
          <label className="flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm">
            <input
              type="checkbox"
              checked={actionOnly}
              onChange={(e) => setActionOnly(e.target.checked)}
              className="size-4 rounded border-border accent-brand"
            />
            Action required only
          </label>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <SortableTh label="Name" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableTh label="Subject" sortKey="subject" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableTh label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                  <th className="px-3 py-3 font-medium">Assigned To</th>
                  <th className="px-3 py-3 font-medium">Action Needed</th>
                  <SortableTh label="Last Updated" sortKey="updatedAt" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((c) => (
                  <tr key={c.id} onClick={() => openPanel(c.id)} className="cursor-pointer hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size="sm" />
                        <p className="font-medium">{c.name}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{c.subject}</td>
                    <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {c.assignedTo.length === 0 ? "—" : c.assignedTo.join(", ")}
                    </td>
                    <td className="px-3 py-3">
                      <ActionNeededBadge label={c.actionNeeded} highlight={c.actionHighlight} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(c.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                      No candidates match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
            Showing {sorted.length} of {rows.length}
          </div>
        </Card>
      </div>

      {panel && (
        <CandidatePanel
          key={panel.id}
          candidateId={panel.id}
          initialTab={panel.tab}
          onClose={closePanel}
          onChanged={onChanged}
        />
      )}
    </>
  )
}
