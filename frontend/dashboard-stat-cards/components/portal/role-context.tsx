"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { RoleKey } from "@/lib/data"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

export interface ActiveUser {
  name: string
  roles: RoleKey[]
  department: string
}

const defaultUser: ActiveUser = { name: "Loading…", roles: ["teacher"], department: "" }

interface RoleContextValue {
  role: RoleKey
  setRole: (r: RoleKey) => void
  user: ActiveUser
}

const RoleContext = createContext<RoleContextValue | null>(null)

function getTokenFromCookie(): string | undefined {
  if (typeof document === "undefined") return undefined
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith("portal_token="))
    ?.split("=")[1]
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ActiveUser>(defaultUser)
  const [role, setRole] = useState<RoleKey>("master_admin")

  useEffect(() => {
    const token = getTokenFromCookie()
    if (!token) return

    fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const roles: RoleKey[] = (data.roles ?? []).map((r: any) => r.name as RoleKey)
        const primaryRole: RoleKey = roles.includes("master_admin")
          ? "master_admin"
          : roles.includes("admin_l2")
            ? "admin_l2"
            : "teacher"
        setUser({ name: data.full_name ?? "User", roles, department: "" })
        setRole(primaryRole)
      })
      .catch(() => {
        // token may be expired; redirect to login
        document.cookie = "portal_token=; path=/; max-age=0"
        window.location.href = "/login"
      })
  }, [])

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
