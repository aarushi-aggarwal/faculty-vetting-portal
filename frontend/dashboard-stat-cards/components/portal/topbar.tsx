"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useRole } from "@/components/portal/role-context"
import type { RoleKey } from "@/lib/data"

const roleOptions: { key: RoleKey; label: string }[] = [
  { key: "master_admin", label: "Master Admin" },
  { key: "admin_l2",     label: "Admin L2" },
  { key: "teacher",      label: "Teacher" },
]

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

      </div>
    </header>
  )
}
