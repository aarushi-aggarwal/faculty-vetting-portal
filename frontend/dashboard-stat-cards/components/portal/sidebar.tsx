"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users2,
  CalendarDays,
  Settings,
  Inbox,
  Video,
  GraduationCap,
  LogOut,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRole } from "@/components/portal/role-context"
import { roleConfig, initials } from "@/lib/badges"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const dashboardItem: NavItem = { label: "Dashboard", href: "/", icon: LayoutDashboard }

// Every user is a teacher first — these links are always present.
const teacherItems: NavItem[] = [
  { label: "My Queue",      href: "/my-queue",      icon: Inbox },
  { label: "My Interviews", href: "/my-interviews", icon: Video },
]

// Admin capabilities stack on top of the teacher base rather than replacing it.
// Assigning and confirming decisions both happen from the Candidates panel now.
const adminItems: NavItem[] = [
  { label: "Candidates", href: "/candidates", icon: Users2 },
  { label: "Interviews", href: "/interviews", icon: CalendarDays },
]

const usersItem: NavItem = { label: "Users", href: "/users", icon: GraduationCap }
const settingsItem: NavItem = { label: "Settings", href: "/settings", icon: Settings }

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-navy-active text-white"
          : "text-navy-foreground/80 hover:bg-white/5 hover:text-white",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
      )}
      <Icon className="size-[18px]" />
      {item.label}
    </Link>
  )
}

function NavSection({ label, items, isActive }: { label?: string; items: NavItem[]; isActive: (href: string) => boolean }) {
  return (
    <div className="space-y-1">
      {label && (
        <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-navy-muted">
          {label}
        </p>
      )}
      {items.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(item.href)} />
      ))}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useRole()

  // Nav is built from the roles the user actually holds — never from the
  // "viewing as" toggle, so switching dashboards never removes a link.
  const isAdmin = user.roles.includes("master_admin") || user.roles.includes("admin_l2")
  const isMasterAdmin = user.roles.includes("master_admin")

  function logout() {
    document.cookie = "portal_token=; path=/; max-age=0"
    router.push("/login")
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[220px] flex-col bg-navy text-navy-foreground">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-brand-foreground">
          <GraduationCap className="size-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Faculty Vetting</p>
          <p className="text-xs text-navy-muted">Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        <NavLink item={dashboardItem} active={isActive(dashboardItem.href)} />

        <NavSection label="My Work" items={teacherItems} isActive={isActive} />

        {isAdmin && (
          <NavSection
            label="Administration"
            items={isMasterAdmin ? [...adminItems, usersItem] : adminItems}
            isActive={isActive}
          />
        )}

        <div className="pt-1">
          <NavLink item={settingsItem} active={isActive(settingsItem.href)} />
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {user.roles.map((r) => (
                <span
                  key={r}
                  className={cn(
                    "rounded px-1.5 py-px text-[10px] font-medium",
                    r === "master_admin" && "bg-white/15 text-white",
                    r === "admin_l2" && "bg-brand/30 text-white",
                    r === "teacher" && "bg-white/10 text-navy-foreground/90",
                  )}
                >
                  {roleConfig[r].label}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-navy-foreground/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  )
}
