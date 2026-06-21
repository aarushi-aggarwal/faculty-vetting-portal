import Link from "next/link"
import { cookies } from "next/headers"
import {
  FileText, Clock, Search, CheckCircle2, CalendarClock,
  Inbox, Video, BookOpen, type LucideIcon,
} from "lucide-react"
import { Topbar } from "@/components/portal/topbar"
import { Avatar, Card, SectionCard } from "@/components/portal/ui"
import { NeedsAttentionClient } from "@/components/portal/needs-attention-client"
import { cn } from "@/lib/utils"
import { pipelineBarColor } from "@/lib/badges"
import { pipeline, teacherWorkload, recentActivity } from "@/lib/data"
import { getDashboardStats, getMyAssignments, getMyInterviews } from "@/lib/fastapi-queries"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

async function getUserRole(token: string): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return "teacher"
    const data = await res.json()
    const roles: string[] = (data.roles ?? []).map((r: any) => r.name)
    if (roles.includes("master_admin")) return "master_admin"
    if (roles.includes("admin_l2"))     return "admin_l2"
    return "teacher"
  } catch {
    return "teacher"
  }
}

// ── Teacher dashboard ──────────────────────────────────────────────────────────

async function TeacherDashboard() {
  const [assignments, interviews] = await Promise.all([
    getMyAssignments(),
    getMyInterviews(),
  ])

  const pending   = assignments.filter((a) => ["pending", "pending_acceptance", "in_review"].includes(a.status)).length
  const completed = assignments.filter((a) => a.status === "completed").length
  const upcoming  = interviews.filter((i) => i.status === "scheduled").length

  const cards = [
    { label: "Pending Reviews",  value: pending,   icon: Inbox,    tone: "bg-amber-100 text-amber-600",  href: "/my-queue" },
    { label: "Reviews Done",     value: completed, icon: CheckCircle2, tone: "bg-green-100 text-green-600", href: "/my-queue" },
    { label: "Upcoming Interviews", value: upcoming, icon: CalendarClock, tone: "bg-blue-100 text-blue-600", href: "/my-interviews" },
  ]

  return (
    <>
      <Topbar title="Dashboard" showDate />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {cards.map((s) => {
            const Icon = s.icon
            return (
              <Link key={s.label} href={s.href}>
                <Card className="cursor-pointer p-4 transition-shadow hover:shadow-md">
                  <span className={cn("flex size-9 items-center justify-center rounded-lg", s.tone)}>
                    <Icon className="size-5" />
                  </span>
                  <p className="mt-3 text-2xl font-bold tracking-tight">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </Card>
              </Link>
            )
          })}
        </div>

        <SectionCard title="Quick Actions">
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
            <Link href="/my-queue" className="flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-muted/40 transition-colors">
              <Inbox className="size-5 text-brand" /><div><p className="text-sm font-medium">My Queue</p><p className="text-xs text-muted-foreground">Review assigned CVs</p></div>
            </Link>
            <Link href="/browse-cvs" className="flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-muted/40 transition-colors">
              <BookOpen className="size-5 text-brand" /><div><p className="text-sm font-medium">Browse CVs</p><p className="text-xs text-muted-foreground">Request CVs to review</p></div>
            </Link>
            <Link href="/my-interviews" className="flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-muted/40 transition-colors">
              <Video className="size-5 text-brand" /><div><p className="text-sm font-medium">My Interviews</p><p className="text-xs text-muted-foreground">View interview schedule</p></div>
            </Link>
          </div>
        </SectionCard>
      </div>
    </>
  )
}

// ── Admin dashboard ────────────────────────────────────────────────────────────

async function AdminDashboard() {
  const stats = await getDashboardStats()

  const statIcons: Record<string, LucideIcon> = {
    users: FileText, activity: Clock, search: Search, check: CheckCircle2, calendar: CalendarClock,
  }

  const dashboardStats = [
    { label: "Total Candidates",     value: stats.totalCandidates,    icon: "users",    tone: "bg-blue-100 text-blue-600",    href: "/candidates" },
    { label: "Under Review",         value: stats.underReview,         icon: "search",   tone: "bg-purple-100 text-purple-600", href: "/candidates?status=under_review" },
    { label: "Shortlisted",          value: stats.shortlisted,         icon: "check",    tone: "bg-green-100 text-green-600",  href: "/candidates?status=shortlisted" },
    { label: "Pending Assignments",  value: stats.pendingAssignments,  icon: "activity", tone: "bg-amber-100 text-amber-600",  href: "/assignments?status=pending" },
    { label: "Completed Interviews", value: stats.completedInterviews, icon: "calendar", tone: "bg-indigo-100 text-indigo-600",href: "/interviews" },
  ]

  return (
    <>
      <Topbar title="Dashboard" showDate />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {dashboardStats.map((stat) => {
            const Icon = statIcons[stat.icon]
            if (!Icon) return null
            return (
              <Link key={stat.label} href={stat.href}>
                <Card className="cursor-pointer p-4 transition-shadow hover:shadow-md">
                  <span className={cn("flex size-9 items-center justify-center rounded-lg", stat.tone)}>
                    <Icon className="size-5" />
                  </span>
                  <p className="mt-3 text-2xl font-bold tracking-tight">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <SectionCard title="Candidate Pipeline" className="lg:col-span-3">
            <div className="space-y-3 p-5">
              {pipeline.map((stage) => {
                const pct = stats.totalCandidates > 0
                  ? Math.round((stage.count / stats.totalCandidates) * 100) : 0
                return (
                  <Link key={stage.stage} href={`/candidates?status=${stage.status}`} className="block group">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium group-hover:text-brand transition-colors">{stage.stage}</span>
                      <span className="tabular-nums text-muted-foreground">{stage.count.toLocaleString()} <span className="text-xs">({pct}%)</span></span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className={cn("h-full rounded-full", pipelineBarColor[stage.status])} style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                  </Link>
                )
              })}
            </div>
          </SectionCard>
          <NeedsAttentionClient />
        </div>

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
                        <span className={cn("font-semibold", row.overdue > 0 ? "text-red-600" : "text-muted-foreground")}>{row.overdue}</span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{row.avgReviewTime}</td>
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
                    <p className="text-sm"><span className="font-medium">{item.actor}</span>{" "}<span className="text-muted-foreground">{item.action}</span></p>
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

// ── Entry point ────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("portal_token")?.value ?? ""
  const role = await getUserRole(token)

  if (role === "teacher") return <TeacherDashboard />
  return <AdminDashboard />
}
