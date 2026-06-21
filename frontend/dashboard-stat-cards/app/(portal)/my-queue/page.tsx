import { Topbar } from "@/components/portal/topbar"
import { getMyAssignments } from "@/lib/fastapi-queries"
import { Card, Avatar, PriorityBadge } from "@/components/portal/ui"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

export default async function MyQueuePage() {
  const assignments = await getMyAssignments()

  return (
    <>
      <Topbar title="My Review Queue" subtitle="Accept and review assigned CVs" />
      <div className="space-y-4 p-6">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Candidate</th>
                  <th className="px-3 py-3 font-medium">Subject</th>
                  <th className="px-3 py-3 font-medium">Priority</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Due Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={a.candidate} size="sm" />
                        <p className="font-medium">{a.candidate}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{a.subject}</td>
                    <td className="px-3 py-3">
                      <PriorityBadge priority={a.priority} />
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{a.status}</td>
                    <td className="px-3 py-3 text-muted-foreground">{a.dueDate}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/candidates/${a.candidateId ?? a.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                      >
                        View CV
                        <ExternalLink className="size-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {assignments.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              No assignments in your queue.
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
