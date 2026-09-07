import Link from "next/link"
import { cookies } from "next/headers"
import {
  FileText, Inbox, Search, CheckCircle2, CalendarClock, ClipboardCheck,
  CalendarPlus, ArrowRight, type LucideIcon,
} from "lucide-react"
import { Topbar } from "@/components/portal/topbar"
import { Avatar, Card, SectionCard } from "@/components/portal/ui"
import { FlowStrip } from "@/components/portal/flow-strip"
import { VIEW_ROLE_COOKIE, primaryRole } from "@/components/portal/role-context"
import { cn } from "@/lib/utils"
import { pipelineBarColor } from "@/lib/badges"
import type { RoleKey } from "@/lib/data"
import {
  getAdminDashboardData, getTeacherWorkload, getMyAssignments, getMyInterviews,
} from "@/lib/fastapi-queries"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

/**
 * Which dashboard to render. Honours the topbar "viewing as" switcher, but only
 * for roles the user genuinely holds — the cookie is never trusted on its own.
 */
async function resolveViewRole(token: string, requested?: string): Promise<RoleKey> {
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return "teacher"
    const data = await res.json()
    const roles: RoleKey[] = (data.roles ?? []).map((r: any) => r.name as RoleKey)

    if (requested && roles.includes(requested as RoleKey)) return requested as RoleKey
    return primaryRole(roles)
  } catch {
    return "teacher"
  }
}

// ── Shared pieces ──────────────────────────────────────────────────────────────

/** Muted icon tones, matching the formal palette. */
const TONE = {
  neutral: "bg-slate-100 text-slate-600",
  steel:   "bg-[#e8edf2] text-[#33506a]",
  amber:   "bg-[#f6efe0] text-[#7a5c1e]",
  green:   "bg-[#e6efe8] text-[#2f5d40]",
}

interface StatCard {
  label: string
  value: number
  icon: LucideIcon
  tone: string
  href: string
}

function StatCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className={cn("grid grid-cols-2 gap-4", cards.length >= 5 ? "md:grid-cols-3 xl:grid-cols-5" : "md:grid-cols-4")}>
      {cards.map((s) => {
        const Icon = s.icon
        return (
          <Link key={s.label} href={s.href}>
            <Card className="cursor-pointer p-4 transition-shadow hover:shadow-md">
              <span className={cn("flex size-9 items-center justify-center rounded-lg", s.tone)}>
                <Icon className="size-5" />
              </span>
              <p className="mt-3 text-2xl font-bold tracking-tight">{s.value.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

function CandidatePipeline({
  stages,
  total,
}: {
  stages: { stage: string; status: string; count: number }[]
  total: number
}) {
  return (
    <SectionCard title="Candidate Pipeline">
      <div className="space-y-3 p-5">
        {stages.map((stage) => {
          const pct = total > 0 ? Math.round((stage.count / total) * 100) : 0
          return (
            <Link key={stage.stage} href={`/candidates?status=${stage.status}`} className="group block">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium transition-colors group-hover:text-brand">{stage.stage}</span>
                <span className="tabular-nums text-muted-foreground">
                  {stage.count.toLocaleString()} <span className="text-xs">({pct}%)</span>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", pipelineBarColor[stage.status as keyof typeof pipelineBarColor])}
                  style={{ width: `${stage.count > 0 ? Math.max(pct, 2) : 0}%` }}
                />
              </div>
            </Link>
          )
        })}
      </div>
    </SectionCard>
  )
}

// ── Master admin: overall pipeline + teacher assignments ───────────────────────

async function MasterAdminDashboard() {
  const [data, workload] = await Promise.all([
    getAdminDashboardData(),
    getTeacherWorkload(),
  ])

  const cards: StatCard[] = [
    { label: "Total Candidates",   value: data.totalCandidates,    icon: FileText,      tone: TONE.neutral, href: "/candidates" },
    { label: "To Assign",          value: data.awaitingAssignment, icon: Inbox,         tone: TONE.amber,   href: "/candidates?status=pending_assignment" },
    { label: "With Teachers",      value: data.outForReview,       icon: Search,        tone: TONE.steel,   href: "/assignments" },
    { label: "Awaiting Decision",  value: data.awaitingDecision,   icon: ClipboardCheck,tone: TONE.amber,   href: "/reviews" },
    { label: "Interviews Scheduled", value: data.interviewsScheduled, icon: CalendarClock, tone: TONE.steel, href: "/interviews" },
  ]

  return (
    <>
      <Topbar title="Dashboard" showDate />
      <div className="space-y-6 p-6">
        <StatCards cards={cards} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CandidatePipeline stages={data.pipeline} total={data.totalCandidates} />

          <SectionCard title="Teacher Assignments">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">Teacher</th>
                    <th className="px-3 py-2.5 text-center font-medium">Assigned</th>
                    <th className="px-3 py-2.5 text-center font-medium">Reviewed</th>
                    <th className="px-3 py-2.5 text-center font-medium">Pending</th>
                    <th className="px-5 py-2.5 text-center font-medium">Interviewed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {workload.map((row) => (
                    <tr key={row.teacherId} className="hover:bg-muted/40">
                      <td className="px-5 py-3 font-medium">{row.teacher}</td>
                      <td className="px-3 py-3 text-center tabular-nums">{row.assigned}</td>
                      <td className="px-3 py-3 text-center tabular-nums text-green-600">{row.reviewed}</td>
                      <td className="px-3 py-3 text-center tabular-nums text-amber-600">{row.pending}</td>
                      <td className="px-5 py-3 text-center tabular-nums text-indigo-600">{row.interviewed}</td>
                    </tr>
                  ))}
                  {workload.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                        No teachers on the portal yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  )
}

// ── Admin L2: assign CVs out, then put shortlisted candidates up for interview ─

async function AdminL2Dashboard() {
  const data = await getAdminDashboardData()

  const cards: StatCard[] = [
    { label: "To Assign",         value: data.awaitingAssignment, icon: Inbox,         tone: TONE.amber, href: "/candidates?status=pending_assignment" },
    { label: "With Teachers",     value: data.outForReview,       icon: Search,        tone: TONE.steel, href: "/assignments" },
    { label: "Awaiting Decision", value: data.awaitingDecision,   icon: ClipboardCheck,tone: TONE.amber, href: "/reviews" },
    { label: "To Schedule",       value: data.shortlisted,        icon: CheckCircle2,  tone: TONE.green, href: "/interviews" },
  ]

  return (
    <>
      <Topbar title="Dashboard" showDate />
      <div className="space-y-6 p-6">
        <FlowStrip active="assign" />
        <StatCards cards={cards} />

        {data.awaitingDecision > 0 && (
          <Link href="/reviews" className="block">
            <Card className="flex items-center gap-3 border-l-4 border-l-[#b99b53] p-4 transition-shadow hover:shadow-md">
              <ClipboardCheck className="size-5 shrink-0 text-[#7a5c1e]" />
              <p className="flex-1 text-sm">
                <span className="font-semibold">{data.awaitingDecision}</span>{" "}
                {data.awaitingDecision === 1 ? "teacher verdict is" : "teacher verdicts are"} waiting
                for you to accept or override.
              </p>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Card>
          </Link>
        )}

        <SectionCard
          title="Cleared for interview — ready to schedule"
          action={
            <Link href="/candidates?status=shortlisted" className="text-xs font-medium text-brand hover:underline">
              View all
            </Link>
          }
        >
          {data.readyForInterview.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Nothing cleared yet — candidates arrive here once you confirm a teacher's verdict.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {data.readyForInterview.slice(0, 8).map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={c.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.subject} · {c.experienceYears} yrs</p>
                  </div>
                  <Link
                    href={`/candidates/${c.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    <CalendarPlus className="size-3.5" /> Schedule interviews
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <CandidatePipeline stages={data.pipeline} total={data.totalCandidates} />
      </div>
    </>
  )
}

// ── Teacher: CVs to scan + scheduled interviews ────────────────────────────────

async function TeacherDashboard() {
  const [assignments, interviews] = await Promise.all([
    getMyAssignments(),
    getMyInterviews(),
  ])

  const toReview = assignments.filter((a) => a.status !== "completed")
  const scanned  = assignments.filter((a) => a.status === "completed")
  const upcoming = interviews.filter((i) => ["scheduled", "rescheduled"].includes(i.status))

  const cards: StatCard[] = [
    { label: "CVs to Scan",         value: toReview.length, icon: Inbox,        tone: TONE.amber, href: "/my-queue" },
    { label: "Scanned",             value: scanned.length,  icon: CheckCircle2, tone: TONE.green, href: "/my-queue?tab=history" },
    { label: "Upcoming Interviews", value: upcoming.length, icon: CalendarClock,tone: TONE.steel, href: "/my-interviews" },
  ]

  return (
    <>
      <Topbar title="Dashboard" showDate />
      <div className="space-y-6 p-6">
        <FlowStrip active="scan" />
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard
            title="CVs waiting on you"
            action={
              <Link href="/my-queue" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                Open queue <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            {toReview.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                Nothing to scan right now.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {toReview.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={a.candidate} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.candidate}</p>
                      <p className="text-xs text-muted-foreground">{a.subject}</p>
                    </div>
                    <span className={cn("text-xs", a.overdue ? "font-semibold text-red-600" : "text-muted-foreground")}>
                      Due {a.dueDate}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Your upcoming interviews"
            action={
              <Link href="/my-interviews" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                View all <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            {upcoming.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                No interviews scheduled for you yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.slice(0, 5).map((iv) => (
                  <li key={iv.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={iv.candidate} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{iv.candidate}</p>
                      <p className="text-xs text-muted-foreground">Round {iv.round} · {iv.location}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{iv.date} · {iv.time}</span>
                  </li>
                ))}
              </ul>
            )}
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
  const requested = cookieStore.get(VIEW_ROLE_COOKIE)?.value
  const role = await resolveViewRole(token, requested)

  if (role === "master_admin") return <MasterAdminDashboard />
  if (role === "admin_l2")     return <AdminL2Dashboard />
  return <TeacherDashboard />
}
