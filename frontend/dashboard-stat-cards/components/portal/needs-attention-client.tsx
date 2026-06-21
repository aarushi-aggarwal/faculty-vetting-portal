"use client"

import { useState } from "react"
import { XCircle, AlarmClock, PauseCircle, type LucideIcon } from "lucide-react"
import { SectionCard } from "@/components/portal/ui"
import { flagQueue, type FlagItem } from "@/lib/data"

const flagIcon: Record<string, LucideIcon> = {
  declined: XCircle,
  overdue: AlarmClock,
  stalled: PauseCircle,
}

export function NeedsAttentionClient() {
  const [flags, setFlags] = useState<FlagItem[]>(flagQueue)

  function resolve(id: string) {
    setFlags((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <SectionCard
      title={<span className="text-white">Needs Attention</span>}
      className="lg:col-span-2"
      headerClassName="bg-red-600 rounded-t-xl border-red-600"
    >
      {flags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
          <span className="mb-1 text-2xl">✓</span>
          All items resolved
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {flags.map((flag) => {
            const Icon = flagIcon[flag.type]
            if (!Icon) return null
            return (
              <li key={flag.id} className="flex gap-3 px-5 py-3.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{flag.candidate}</p>
                  <p className="text-xs text-muted-foreground">{flag.description}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70">{flag.timestamp}</p>
                </div>
                <button
                  type="button"
                  onClick={() => resolve(flag.id)}
                  className="h-7 shrink-0 self-center rounded-md border border-red-300 px-2.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Resolve
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}
