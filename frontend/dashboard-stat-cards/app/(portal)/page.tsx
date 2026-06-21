import {
  FileText,
  Clock,
  Search,
  CheckCircle2,
  CalendarClock,
  XCircle,
  AlarmClock,
  PauseCircle,
  type LucideIcon,
} from "lucide-react"
import { Topbar } from "@/components/portal/topbar"
import { Avatar, Card, SectionCard } from "@/components/portal/ui"
import { cn } from "@/lib/utils"
import { pipelineBarColor } from "@/lib/badges"
import {
  pipeline,
  flagQueue,
  teacherWorkload,
  recentActivity,
} from "@/lib/data"
import { getDashboardStats } from "@/lib/fastapi-queries"

const statIcons: Record<string, LucideIcon> = {
  users: FileText,
  activity: Clock,
  search: Search,
  check: CheckCircle2,
  calendar: CalendarClock,
}

const flagIcon: Record<string, LucideIcon> = {
  declined: XCircle,
  overdue: AlarmClock,
  stalled: PauseCircle,
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const dashboardStats = [
    { label: "Total Candidates", value: stats.totalCandidates, icon: "users", tone: "bg-blue-100 text-blue-600" },
    { label: "Under Review", value: stats.underReview, icon: "activity", tone: "bg-purple-100 text-purple-600" },
    { label: "Shortlisted", value: stats.shortlisted, icon: "check", tone: "bg-green-100 text-green-600" },
    { label: "Pending Assignments", value: stats.pendingAssignments, icon: "activity", tone: "bg-amber-100 text-amber-600" },
    { label: "Completed Interviews", value: stats.completedInterviews, icon: "calendar", tone: "bg-indigo-100 text-indigo-600" },
  ]

  return (
    <>
      <Topbar title="Dashboard" showDate />
      <div className="space-y-6 p-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {dashboardStats.map((stat) => {
            const Icon = statIcons[stat.icon]
            if (!Icon) return null
            return (
              <Card key={stat.label} className="p-4">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      stat.tone,
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Card>
            )
          })}
        </div>

        {/* Row 2: funnel + flags */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <SectionCard title="Candidate Pipeline" className="lg:col-span-3">
            <div className="space-y-3 p-5">
              {pipeline.map((stage) => {
                const pct = Math.round((stage.count / stats.totalCandidates) * 100)
                return (
                  <div key={stage.stage}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{stage.stage}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {stage.count.toLocaleString()}{" "}
                        <span className="text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", pipelineBarColor[stage.status])}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard
            title={<span className="text-white">Needs Attention</span>}
            className="lg:col-span-2"
            headerClassName="bg-red-600 rounded-t-xl border-red-600"
          >
            <ul className="divide-y divide-border">
              {flagQueue.map((flag) => {
                const Icon = flagIcon[flag.type]
                if (!Icon) return null
                return (
                  <li key={flag.id} className="flex gap-3 px-5 py-3.5">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{flag.candidate}</p>
                      <p className="text-xs text-muted-foreground">{flag.description}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                        {flag.timestamp}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="h-7 shrink-0 self-center rounded-md border border-red-300 px-2.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Resolve
                    </button>
                  </li>
                )
              })}
            </ul>
          </SectionCard>
        </div>

        {/* Row 3: workload + activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Teacher Workload">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">Teacher</th>
                    <th className="px-3 py-2.5 text-center font-medium">Assigned</th>
                    <th className="px-3 py-2.5 text-center font-medium">Reviewed</th>
                    <th className="px-3 py-2.5 text-center font-medium">Pending</th>
                    <th className="px-3 py-2.5 text-center font-medium">Overdue</th>
                    <th className="px-3 py-2.5 text-right font-medium">Avg Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {teacherWorkload.map((row) => (
                    <tr key={row.teacher} className="hover:bg-muted/40">
                      <td className="px-5 py-3 font-medium">{row.teacher}</td>
                      <td className="px-3 py-3 text-center tabular-nums">{row.assigned}</td>
                      <td className="px-3 py-3 text-center tabular-nums">{row.reviewed}</td>
                      <td className="px-3 py-3 text-center tabular-nums">{row.pending}</td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        <span
                          className={cn(
                            "font-semibold",
                            row.overdue > 0 ? "text-red-600" : "text-muted-foreground",
                          )}
                        >
                          {row.overdue}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                        {row.avgReviewTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Recent Activity">
            <ul className="divide-y divide-border">
              {recentActivity.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={item.actor} size="sm" className="bg-slate-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{item.actor}</span>{" "}
                      <span className="text-muted-foreground">{item.action}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground/70">{item.timestamp}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </>
  )
}
