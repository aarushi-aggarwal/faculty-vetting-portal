import { Topbar } from "@/components/portal/topbar"
import { UsersClient } from "@/components/portal/users-client"
import { getUsers } from "@/lib/fastapi-queries"

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <>
      <Topbar title="Users" subtitle={`${users.length} users`} showDate />
      <UsersClient users={users} />
    </>
  )
}
