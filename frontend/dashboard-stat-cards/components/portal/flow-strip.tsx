import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * The vetting pipeline, drawn as one line so anyone landing on a page can see
 * where that page sits in the process.
 */
const STEPS = [
  { key: "assign",    label: "Admin assigns CV" },
  { key: "scan",      label: "Teacher scans" },
  { key: "decision",  label: "Admin confirms" },
  { key: "interview", label: "Interview" },
  { key: "final",     label: "Accept / Reject" },
] as const

export type FlowStep = (typeof STEPS)[number]["key"]

export function FlowStrip({ active }: { active: FlowStep }) {
  const activeIndex = STEPS.findIndex((s) => s.key === active)

  return (
    <ol className="mb-4 flex flex-wrap items-center gap-x-1 gap-y-2 rounded-md border border-border bg-card px-4 py-2.5 text-xs">
      {STEPS.map((step, i) => {
        const isActive = i === activeIndex
        const isPast = i < activeIndex
        return (
          <li key={step.key} className="flex items-center gap-1">
            <span
              className={cn(
                "rounded px-2 py-1 font-medium",
                isActive && "bg-brand text-brand-foreground",
                isPast && "text-muted-foreground",
                !isActive && !isPast && "text-muted-foreground/60",
              )}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
