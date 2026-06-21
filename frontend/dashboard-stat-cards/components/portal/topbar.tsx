"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { Bell, XCircle, AlarmClock, PauseCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRole } from "@/components/portal/role-context"
import { flagQueue } from "@/lib/data"
import type { RoleKey } from "@/lib/data"

const roleOptions: { key: RoleKey; label: string }[] = [
  { key: "master_admin", label: "Master Admin" },
  { key: "admin_l2",     label: "Admin L2" },
  { key: "teacher",      label: "Teacher" },
]

const flagIcon: Record<string, React.ElementType> = {
  declined: XCircle,
  overdue:  AlarmClock,
  stalled:  PauseCircle,
}

export function Topbar({
  title,
  subtitle,
  actions,
  showDate = false,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  showDate?: boolean
}) {
  const { role, setRole, user } = useRole()
  const isMasterAdmin = user.roles.includes("master_admin")

  const [notifOpen, setNotifOpen] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = flagQueue.filter((f) => !dismissed.has(f.id))

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]))
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/80 px-6 py-4 backdrop-blur">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle  && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        {showDate  && <p className="mt-0.5 text-sm text-muted-foreground">{today}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        {/* Role switcher — master_admin only */}
        {isMasterAdmin && (
          <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
            {roleOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setRole(opt.key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  role === opt.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Notification bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-[18px]" />
            {visible.length > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                {visible.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold">Needs Attention</p>
                  <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </div>
                {visible.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">All clear ✓</p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto divide-y divide-border">
                    {visible.map((f) => {
                      const Icon = flagIcon[f.type]
                      return (
                        <li key={f.id} className="flex gap-3 px-4 py-3">
                          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                            {Icon && <Icon className="size-3.5" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{f.candidate}</p>
                            <p className="text-xs text-muted-foreground">{f.description}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground/70">{f.timestamp}</p>
                          </div>
                          <button
                            onClick={() => dismiss(f.id)}
                            className="shrink-0 self-center rounded-md border border-red-200 px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Resolve
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
