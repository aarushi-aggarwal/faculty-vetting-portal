"use client"

import { useMemo, useState } from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type SortDir = "asc" | "desc"

/**
 * Generic client-side sort for a table. `accessors` maps a column key to a
 * function pulling the comparable value off a row — string/number/Date all
 * compare correctly via `<`/`>`.
 */
export function useSortableRows<T, K extends string>(
  rows: T[],
  accessors: Record<K, (row: T) => string | number | Date | null | undefined>,
  initial: { key: K; dir: SortDir },
) {
  const [sortKey, setSortKey] = useState<K>(initial.key)
  const [sortDir, setSortDir] = useState<SortDir>(initial.dir)

  const sorted = useMemo(() => {
    const accessor = accessors[sortKey]
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return copy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortKey, sortDir])

  function toggleSort(key: K) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  return { sorted, sortKey, sortDir, toggleSort }
}

/** A clickable <th> with an arrow showing sort direction when active. */
export function SortableTh<K extends string>({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className,
  align = "left",
}: {
  label: string
  sortKey: K
  activeKey: K
  dir: SortDir
  onSort: (key: K) => void
  className?: string
  align?: "left" | "center" | "right"
}) {
  const active = sortKey === activeKey
  return (
    <th className={cn("px-3 py-3 font-medium first:px-5 last:px-5", className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          align === "center" && "justify-center",
          align === "right" && "justify-end",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        {active ? (
          dir === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-40" />
        )}
      </button>
    </th>
  )
}
