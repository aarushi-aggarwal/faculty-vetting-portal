"use client"

import { useSortableRows, SortableTh } from "./sortable"
import type { WorkloadRow } from "@/lib/data"

type SortKey = "teacher" | "assigned" | "reviewed" | "pending" | "interviewed"

export function SortableTeacherAssignmentsTable({ rows }: { rows: WorkloadRow[] }) {
  const { sorted, sortKey, sortDir, toggleSort } = useSortableRows<WorkloadRow, SortKey>(
    rows,
    {
      teacher: (r) => r.teacher.toLowerCase(),
      assigned: (r) => r.assigned,
      reviewed: (r) => r.reviewed,
      pending: (r) => r.pending,
      interviewed: (r) => r.interviewed,
    },
    { key: "assigned", dir: "desc" },
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <SortableTh label="Teacher" sortKey="teacher" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
            <SortableTh label="Assigned" sortKey="assigned" activeKey={sortKey} dir={sortDir} onSort={toggleSort} align="center" />
            <SortableTh label="Reviewed" sortKey="reviewed" activeKey={sortKey} dir={sortDir} onSort={toggleSort} align="center" />
            <SortableTh label="Pending" sortKey="pending" activeKey={sortKey} dir={sortDir} onSort={toggleSort} align="center" />
            <SortableTh label="Interviewed" sortKey="interviewed" activeKey={sortKey} dir={sortDir} onSort={toggleSort} align="center" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((row) => (
            <tr key={row.teacherId} className="hover:bg-muted/40">
              <td className="px-5 py-3 font-medium">{row.teacher}</td>
              <td className="px-3 py-3 text-center tabular-nums">{row.assigned}</td>
              <td className="px-3 py-3 text-center tabular-nums text-[#2f5d40]">{row.reviewed}</td>
              <td className="px-3 py-3 text-center tabular-nums text-[#7a5c1e]">{row.pending}</td>
              <td className="px-5 py-3 text-center tabular-nums text-[#33506a]">{row.interviewed}</td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                No teachers on the portal yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
