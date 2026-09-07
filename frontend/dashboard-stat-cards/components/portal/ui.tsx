import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import {
  adminActionConfig,
  assignmentStatusConfig,
  fallbackBadge,
  initials,
  interviewStatusConfig,
  outcomeConfig,
  priorityConfig,
  roleConfig,
  statusConfig,
  verdictConfig,
  type BadgeStyle,
} from "@/lib/badges"
import type {
  AssignmentStatus,
  CvStatus,
  InterviewStatus,
  Priority,
  RoleKey,
} from "@/lib/data"

const badgeBase =
  "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap"

/**
 * Badge values come from the database, which can hold statuses this build has no
 * styling for (legacy rows, a newer backend). Fall back rather than crashing the page.
 */
function Badge({ style, fallbackLabel }: { style?: BadgeStyle; fallbackLabel?: string }) {
  const c = style ?? { ...fallbackBadge, label: fallbackLabel ?? fallbackBadge.label }
  return <span className={cn(badgeBase, c.className)}>{c.label}</span>
}

export function StatusBadge({ status }: { status: CvStatus }) {
  return <Badge style={statusConfig[status]} fallbackLabel={status} />
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge style={priorityConfig[priority]} fallbackLabel={priority} />
}

export function RoleBadge({ role }: { role: RoleKey }) {
  return <Badge style={roleConfig[role]} fallbackLabel={role} />
}

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  return <Badge style={assignmentStatusConfig[status]} fallbackLabel={status} />
}

export function InterviewStatusBadge({ status }: { status: InterviewStatus }) {
  return <Badge style={interviewStatusConfig[status]} fallbackLabel={status} />
}

export function VerdictBadge({ verdict }: { verdict: string }) {
  return <Badge style={verdictConfig[verdict]} fallbackLabel={verdict} />
}

export function AdminActionBadge({ action }: { action: string }) {
  return <Badge style={adminActionConfig[action]} fallbackLabel={action} />
}

export function OutcomeBadge({ verdict }: { verdict: string }) {
  return <Badge style={outcomeConfig[verdict]} fallbackLabel={verdict} />
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
