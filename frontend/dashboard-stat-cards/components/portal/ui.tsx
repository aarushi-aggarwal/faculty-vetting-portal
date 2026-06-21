import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import {
  assignmentStatusConfig,
  initials,
  interviewStatusConfig,
  outcomeConfig,
  priorityConfig,
  roleConfig,
  statusConfig,
} from "@/lib/badges"
import type {
  AssignmentStatus,
  CvStatus,
  InterviewStatus,
  Priority,
  RoleKey,
} from "@/lib/data"

const badgeBase =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap"

export function StatusBadge({ status }: { status: CvStatus }) {
  const c = statusConfig[status]
  return <span className={cn(badgeBase, c.className)}>{c.label}</span>
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const c = priorityConfig[priority]
  return <span className={cn(badgeBase, c.className)}>{c.label}</span>
}

export function RoleBadge({ role }: { role: RoleKey }) {
  const c = roleConfig[role]
  return <span className={cn(badgeBase, c.className)}>{c.label}</span>
}

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const c = assignmentStatusConfig[status]
  return <span className={cn(badgeBase, c.className)}>{c.label}</span>
}

export function InterviewStatusBadge({ status }: { status: InterviewStatus }) {
  const c = interviewStatusConfig[status]
  return <span className={cn(badgeBase, c.className)}>{c.label}</span>
}

export function OutcomeBadge({ verdict }: { verdict: string }) {
  const c = outcomeConfig[verdict]
  if (!c) return null
  return <span className={cn(badgeBase, c.className)}>{c.label}</span>
}

export function Avatar({
  name,
  className,
  size = "md",
}: {
  name: string
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizes = {
    sm: "size-7 text-xs",
    md: "size-9 text-sm",
    lg: "size-12 text-base",
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        sizes[size],
        className ?? "bg-[#1b3a6b]",
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

export function Card({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionCard({
  title,
  action,
  children,
  className,
  headerClassName,
}: {
  title: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b border-border px-5 py-3.5",
          headerClassName,
        )}
      >
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </Card>
  )
}
