import Link from "next/link"
import { Clock, Video } from "lucide-react"
import { Topbar } from "@/components/portal/topbar"
import { getMyInterviews } from "@/lib/fastapi-queries"
import { Avatar, Card } from "@/components/portal/ui"

export default async function MyInterviewsPage() {
  const interviews = await getMyInterviews()

  return (
    <>
      <Topbar title="My Interviews" subtitle="Panels you are part of" />
      <div className="space-y-4 p-6">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Candidate</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Time</th>
                  <th className="px-3 py-3 font-medium">Location</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {interviews.map((iv) => (
                  <tr key={iv.id} className="hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={iv.candidate} size="sm" />
                        <p className="font-medium">{iv.candidate}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{iv.date}</td>
                    <td className="px-3 py-3 text-muted-foreground">{iv.time}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Video className="size-4" />
                        {iv.location}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                        {iv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {interviews.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              No interviews scheduled yet.
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
