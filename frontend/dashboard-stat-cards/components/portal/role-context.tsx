"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { RoleKey } from "@/lib/data"
import { VIEW_ROLE_COOKIE, primaryRole, viewableRoles } from "@/lib/roles"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

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

        // Restore the chosen view, but only if it's one this user can legitimately see.
        const saved = readCookie(VIEW_ROLE_COOKIE) as RoleKey | undefined
        const allowed = viewableRoles(roles)
        setRoleState(saved && allowed.includes(saved) ? saved : primaryRole(roles))
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
