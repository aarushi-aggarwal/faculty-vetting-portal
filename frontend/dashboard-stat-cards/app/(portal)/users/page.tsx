import { Topbar } from "@/components/portal/topbar"
import { Card } from "@/components/ui/card"

export default function UsersPage() {
  return (
    <>
      <Topbar title="Users" showDate />
      <div className="space-y-6 p-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Users Management</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            User management functionality coming soon.
          </p>
        </Card>
      </div>
    </>
  )
}
