"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useRole, viewableRoles } from "@/components/portal/role-context"
import type { RoleKey } from "@/lib/data"

const roleLabel: Record<RoleKey, string> = {
  master_admin: "Master Admin",
  admin_l2:     "Admin Level 2",
  teacher:      "Teacher",
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

  // Anyone who can view more than one dashboard gets the switcher.
  const availableRoles = viewableRoles(user.roles)
  const showSwitcher = availableRoles.length > 1

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

        {/* View-as switcher — shown to anyone holding more than one role */}
        {showSwitcher && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Viewing as</span>
            <div className="flex items-center rounded-md border border-border bg-muted/50 p-0.5">
              {availableRoles.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRole(key)}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                    role === key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {roleLabel[key]}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </header>
  )
}
