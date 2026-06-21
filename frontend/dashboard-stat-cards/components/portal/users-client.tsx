"use client"

import { useState } from "react"
import { Search, X, ShieldPlus, ShieldMinus, Power, Loader2, CheckCircle2 } from "lucide-react"
import { Avatar, Card, RoleBadge } from "./ui"
import type { PortalUser, RoleKey } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

function getToken() {
  if (typeof document === "undefined") return ""
  return document.cookie.split("; ").find((c) => c.startsWith("portal_token="))?.split("=")[1] ?? ""
}

const ALL_ROLES: { key: RoleKey; label: string }[] = [
  { key: "master_admin", label: "Master Admin" },
  { key: "admin_l2",     label: "Admin L2" },
  { key: "teacher",      label: "Teacher" },
]

export function UsersClient({ users }: { users: PortalUser[] }) {
  const [query, setQuery] = useState("")
  const [localUsers, setLocalUsers] = useState(users)
  const [selected, setSelected] = useState<PortalUser | null>(null)
  const [working, setWorking] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const filtered = localUsers.filter(
    (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())
  )

  function flash(text: string, ok: boolean) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3000)
  }

  function updateLocal(userId: string, patch: Partial<PortalUser>) {
    setLocalUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...patch } : u)))
    setSelected((prev) => (prev?.id === userId ? { ...prev, ...patch } : prev))
  }

  async function assignRole(role: RoleKey) {
    if (!selected) return
    setWorking(true)
    try {
      const res = await fetch(`${API_URL}/users/assign-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ user_id: selected.id, role_name: role }),
      })
      if (res.ok) {
        const newRoles = [...selected.roles, role] as RoleKey[]
        updateLocal(selected.id, { roles: newRoles })
        flash(`Role '${role}' assigned`, true)
      } else {
        const d = await res.json().catch(() => ({}))
        flash((d as any).detail ?? "Failed", false)
      }
    } finally { setWorking(false) }
  }

  async function revokeRole(role: RoleKey) {
    if (!selected) return
    setWorking(true)
    try {
      const res = await fetch(`${API_URL}/users/${selected.id}/roles/${role}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (res.ok) {
        const newRoles = selected.roles.filter((r) => r !== role) as RoleKey[]
        updateLocal(selected.id, { roles: newRoles })
        flash(`Role '${role}' revoked`, true)
      } else {
        flash("Failed to revoke", false)
      }
    } finally { setWorking(false) }
  }

  async function toggleActive() {
    if (!selected) return
    setWorking(true)
    try {
      const res = await fetch(`${API_URL}/users/${selected.id}/active`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (res.ok) {
        const data = await res.json()
        updateLocal(selected.id, { active: data.is_active })
        flash(data.is_active ? "User activated" : "User deactivated", true)
      }
    } finally { setWorking(false) }
  }

  return (
    <>
      <div className="space-y-4 p-6">
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Roles</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} onClick={() => setSelected(u)} className="cursor-pointer hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <p className="font-medium">{u.name}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => <RoleBadge key={r} role={r} />)}
                        {u.roles.length === 0 && <span className="text-xs text-muted-foreground">No roles</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={u.active ? "text-xs font-medium text-green-600" : "text-xs text-muted-foreground"}>
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="p-6 text-center text-muted-foreground">No users match your search.</div>}
        </Card>
      </div>

      {/* User detail panel */}
      {selected && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <aside className="absolute right-0 top-0 flex h-full w-[400px] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">User Details</h2>
              <button onClick={() => setSelected(null)} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <Avatar name={selected.name} size="lg" />
                <div>
                  <p className="font-semibold text-lg">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                  <span className={`mt-1 inline-block text-xs font-medium ${selected.active ? "text-green-600" : "text-red-500"}`}>
                    {selected.active ? "● Active" : "● Inactive"}
                  </span>
                </div>
              </div>

              {/* Current roles */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Roles</p>
                {selected.roles.length === 0
                  ? <p className="text-sm text-muted-foreground">No roles assigned</p>
                  : <div className="flex flex-wrap gap-2">
                      {selected.roles.map((r) => (
                        <div key={r} className="flex items-center gap-1.5">
                          <RoleBadge role={r} />
                          <button
                            onClick={() => revokeRole(r)}
                            disabled={working}
                            title={`Revoke ${r}`}
                            className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <ShieldMinus className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                }
              </div>

              {/* Assign role */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assign Role</p>
                <div className="flex flex-col gap-2">
                  {ALL_ROLES.filter((r) => !selected.roles.includes(r.key)).map((r) => (
                    <button
                      key={r.key}
                      onClick={() => assignRole(r.key)}
                      disabled={working}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                    >
                      <ShieldPlus className="size-4 text-brand" />
                      Assign {r.label}
                    </button>
                  ))}
                  {ALL_ROLES.every((r) => selected.roles.includes(r.key)) && (
                    <p className="text-xs text-muted-foreground">All roles assigned</p>
                  )}
                </div>
              </div>

              {/* Feedback message */}
              {msg && (
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {msg.ok && <CheckCircle2 className="size-4" />}
                  {msg.text}
                </div>
              )}
            </div>

            {/* Toggle active */}
            <div className="border-t border-border p-4">
              <button
                onClick={toggleActive}
                disabled={working}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60 ${
                  selected.active
                    ? "border border-red-300 text-red-600 hover:bg-red-50"
                    : "border border-green-300 text-green-700 hover:bg-green-50"
                }`}
              >
                {working ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
                {selected.active ? "Deactivate User" : "Activate User"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
