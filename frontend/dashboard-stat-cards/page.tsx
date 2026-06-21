"use client"

import { useMemo, useState } from "react"
import {
  Check,
  Search,
  Shield,
  UserCog,
  Users as UsersIcon,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  portalUsers,
  userSummary,
  type PortalUser,
  type RoleKey,
} from "@/lib/data"
import { roleConfig } from "@/lib/badges"
import { Avatar, Card, RoleBadge, SectionCard } from "@/components/portal/ui"
import { Button } from "@/components/ui/button"

const roleOptions: { key: RoleKey; label: string; description: string }[] = [
  {
    key: "master_admin",
    label: "Master Admin",
    description: "Full control: oversight, interviews, user & role management.",
  },
  {
    key: "admin_l2",
    label: "Admin L2",
    description: "Assigns CVs to teachers and manages review pipelines.",
  },
  {
    key: "teacher",
    label: "Teacher",
    description: "Reviews assigned candidate CVs and submits verdicts.",
  },
]

const summaryCards = [
  { label: "Total Users", value: userSummary.total, icon: UsersIcon, tone: "text-[#1b3a6b]" },
  { label: "Master Admins", value: userSummary.masterAdmins, icon: Shield, tone: "text-[#1b3a6b]" },
  { label: "Admin L2", value: userSummary.adminL2, icon: UserCog, tone: "text-blue-600" },
  { label: "Teachers", value: userSummary.teachers, icon: UsersIcon, tone: "text-slate-500" },
]

export default function UsersPage() {
  const [users, setUsers] = useState<PortalUser[]>(portalUsers)
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | RoleKey>("all")
  const [editing, setEditing] = useState<PortalUser | null>(null)

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesQuery =
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase()) ||
        u.department.toLowerCase().includes(query.toLowerCase())
      const matchesRole = roleFilter === "all" || u.roles.includes(roleFilter)
      return matchesQuery && matchesRole
    })
  }, [users, query, roleFilter])

  function saveRoles(userId: string, roles: RoleKey[]) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, roles } : u)),
    )
    setEditing(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage faculty and administrators, and assign one or more roles per
            person.
          </p>
        </div>
        <Button className="bg-[#1b3a6b] text-white hover:bg-[#284e87]">
          Invite User
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <Icon className={cn("size-5", s.tone)} aria-hidden />
              </div>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
                {s.value}
              </p>
            </Card>
          )
        })}
      </div>

      <SectionCard
        title={`All Users (${filtered.length})`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#1b3a6b]/30"
                aria-label="Search users"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "all" | RoleKey)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-[#1b3a6b]/30"
              aria-label="Filter by role"
            >
              <option value="all">All roles</option>
              <option value="master_admin">Master Admin</option>
              <option value="admin_l2">Admin L2</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Roles</th>
                <th className="px-5 py-3 font-medium">Review Bandwidth</th>
                <th className="px-5 py-3 font-medium">Activity</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const pct = u.bandwidthMax
                  ? Math.round((u.bandwidthUsed / u.bandwidthMax) * 100)
                  : 0
                return (
                  <tr
                    key={u.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={u.name}
                          className={roleConfig[u.roles[0]].avatar}
                        />
                        <div>
                          <p className="font-medium text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {u.department}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <RoleBadge key={r} role={r} />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {u.bandwidthMax ? (
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {u.bandwidthUsed}/{u.bandwidthMax}
                            </span>
                            <span>{pct}%</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                pct >= 100
                                  ? "bg-red-500"
                                  : pct >= 80
                                    ? "bg-amber-500"
                                    : "bg-green-500",
                              )}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      <span className="tabular-nums text-foreground">
                        {u.reviewed}
                      </span>{" "}
                      reviewed ·{" "}
                      <span className="tabular-nums text-foreground">
                        {u.interviews}
                      </span>{" "}
                      interviews
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-medium",
                          u.active ? "text-green-600" : "text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            u.active ? "bg-green-500" : "bg-slate-400",
                          )}
                        />
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(u)}
                        className="h-8"
                      >
                        <UserCog className="mr-1.5 size-3.5" aria-hidden />
                        Manage Roles
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {editing && (
        <ManageRolesModal
          user={editing}
          onClose={() => setEditing(null)}
          onSave={saveRoles}
        />
      )}
    </div>
  )
}

function ManageRolesModal({
  user,
  onClose,
  onSave,
}: {
  user: PortalUser
  onClose: () => void
  onSave: (userId: string, roles: RoleKey[]) => void
}) {
  const [selected, setSelected] = useState<RoleKey[]>(user.roles)

  function toggle(role: RoleKey) {
    setSelected((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Manage roles for ${user.name}`}
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg overflow-hidden"
        // stop backdrop close when clicking the panel
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col"
        >
          <div className="flex items-start justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} size="lg" />
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {user.name}
                </h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close dialog"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="space-y-3 px-5 py-4">
            <p className="text-sm text-muted-foreground">
              Assign one or more roles. A single person can hold multiple roles
              simultaneously (for example, a teacher who is also an Admin L2).
            </p>
            {roleOptions.map((opt) => {
              const active = selected.includes(opt.key)
              return (
                <button
                  key={opt.key}
                  onClick={() => toggle(opt.key)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    active
                      ? "border-[#1b3a6b] bg-[#1b3a6b]/5"
                      : "border-border hover:bg-muted/50",
                  )}
                  aria-pressed={active}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border",
                      active
                        ? "border-[#1b3a6b] bg-[#1b3a6b] text-white"
                        : "border-input",
                    )}
                  >
                    {active && <Check className="size-3.5" aria-hidden />}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      {opt.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {opt.description}
                    </span>
                  </span>
                </button>
              )
            })}
            {selected.length === 0 && (
              <p className="text-xs text-red-600">
                At least one role must be selected.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={selected.length === 0}
              onClick={() => onSave(user.id, selected)}
              className="bg-[#1b3a6b] text-white hover:bg-[#284e87]"
            >
              Save Roles
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
