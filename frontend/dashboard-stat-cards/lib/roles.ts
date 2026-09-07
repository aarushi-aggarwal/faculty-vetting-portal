// Plain role helpers, deliberately NOT in role-context.tsx.
//
// role-context.tsx is "use client" — a Server Component that imports a function
// from a "use client" module gets a client reference back, not the function
// itself, and calling it throws at runtime ("Attempted to call X() from the
// server but X is on the client"). These helpers are used from both the
// server-rendered dashboard (app/(portal)/page.tsx) and the client topbar, so
// they have to live somewhere with no "use client" directive.
import type { RoleKey } from "@/lib/data"

/** Which role the user is currently *viewing* the portal as (cookie name). */
export const VIEW_ROLE_COOKIE = "portal_view_role"

/** Highest privilege a user holds — their default view. */
export function primaryRole(roles: RoleKey[]): RoleKey {
  if (roles.includes("master_admin")) return "master_admin"
  if (roles.includes("admin_l2")) return "admin_l2"
  return "teacher"
}

/**
 * Dashboards a user may switch between. A master admin outranks admin_l2, so they
 * can preview that dashboard too even though the role isn't separately granted to
 * them — everyone below teacher is still gated on actually holding the role.
 */
export function viewableRoles(roles: RoleKey[]): RoleKey[] {
  if (roles.includes("master_admin")) return ["master_admin", "admin_l2", "teacher"]
  if (roles.includes("admin_l2")) return ["admin_l2", "teacher"]
  return ["teacher"]
}
