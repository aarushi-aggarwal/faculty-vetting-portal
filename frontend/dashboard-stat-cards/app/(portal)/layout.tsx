import type { ReactNode } from "react"
import { RoleProvider } from "@/components/portal/role-context"
import { Sidebar } from "@/components/portal/sidebar"

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <div className="min-h-svh bg-background">
        <Sidebar />
        <div className="pl-[220px]">
          <main className="min-h-svh">{children}</main>
        </div>
      </div>
    </RoleProvider>
  )
}
