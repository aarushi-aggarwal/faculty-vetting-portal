"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { RoleKey } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

/**
 * Which role the user is currently *viewing* the portal as. Server components read
 * the same cookie, so switching role changes server-rendered pages too.
 */
export const VIEW_ROLE_COOKIE = "portal_view_role"

export interface ActiveUser {
  name: string
  email: string
  roles: RoleKey[]
  department: string
}

const defaultUser: ActiveUser = {
  name: "Loading…",
  email: "",
  roles: ["teacher"],
  department: "",
}

interface RoleContextValue {
  role: RoleKey
  setRole: (r: RoleKey) => void
  user: ActiveUser
}

const RoleContext = createContext<RoleContextValue | null>(null)

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1]
}

/** Highest privilege a user holds — their default view. */
export function primaryRole(roles: RoleKey[]): RoleKey {
  if (roles.includes("master_admin")) return "master_admin"
  if (roles.includes("admin_l2")) return "admin_l2"
  return "teacher"
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<ActiveUser>(defaultUser)
  const [role, setRoleState] = useState<RoleKey>("master_admin")

  useEffect(() => {
    const token = readCookie("portal_token")
    if (!token) return

    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const roles: RoleKey[] = (data.roles ?? []).map((r: any) => r.name as RoleKey)
        setUser({
          name: data.full_name ?? "User",
          email: data.email ?? "",
          roles,
          department: "",
        })

        // Restore the chosen view, but only if the user actually holds that role.
        const saved = readCookie(VIEW_ROLE_COOKIE) as RoleKey | undefined
        setRoleState(saved && roles.includes(saved) ? saved : primaryRole(roles))
      })
      .catch(() => {
        document.cookie = "portal_token=; path=/; max-age=0"
        window.location.href = "/login"
      })
  }, [])

  function setRole(next: RoleKey) {
    setRoleState(next)
    // Persist for server components, then re-render them with the new view.
    document.cookie = `${VIEW_ROLE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 30}`
    router.refresh()
  }

  return (
    <RoleContext.Provider value={{ role, setRole, user }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error("useRole must be used within RoleProvider")
  return ctx
}
