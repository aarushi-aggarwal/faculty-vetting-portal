import Link from "next/link"
import { cookies } from "next/headers"
import {
  Inbox, Search, CheckCircle2, CalendarClock, ClipboardCheck,
  CalendarPlus, ArrowRight, type LucideIcon,
} from "lucide-react"
import { Topbar } from "@/components/portal/topbar"
import { Avatar, Card, SectionCard, VerdictBadge } from "@/components/portal/ui"
import { SortableTeacherAssignmentsTable } from "@/components/portal/teacher-assignments-table"
import { VIEW_ROLE_COOKIE, primaryRole, viewableRoles } from "@/lib/roles"
import { cn } from "@/lib/utils"
import { pipelineBarColor } from "@/lib/badges"
import type { RoleKey, PendingReview } from "@/lib/data"
import {
  getAdminDashboardData, getTeacherWorkload, getMyAssignments, getMyInterviews,
  getPendingReviews,
} from "@/lib/fastapi-queries"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

/**
 * Which dashboard to render. Honours the topbar "viewing as" switcher, but only
 * for a dashboard the user is actually entitled to see — the cookie is never
 * trusted on its own.
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

    const allowed = viewableRoles(roles)
    if (requested && allowed.includes(requested as RoleKey)) return requested as RoleKey
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

// ── Shared by both admin dashboards: the day-to-day work queues ────────────────
// Kept as one component so Master Admin and Admin L2 cannot drift apart again —
// every admin can do this work, regardless of level.

function AdminOperationalBlock({
  data,
  reviews,
}: {
  data: Awaited<ReturnType<typeof getAdminDashboardData>>
  reviews: PendingReview[]
}) {
  const cards: StatCard[] = [
    { label: "To Assign",         value: data.awaitingAssignment,   icon: Inbox,          tone: TONE.amber, href: "/candidates?status=pending_assignment" },
    { label: "With Teachers",     value: data.outForReview,         icon: Search,         tone: TONE.steel, href: "/candidates?status=assigned" },
    { label: "Awaiting Decision", value: data.awaitingDecision,     icon: ClipboardCheck, tone: TONE.amber, href: "/candidates?actionRequired=1" },
    { label: "To Schedule",       value: data.shortlisted,          icon: CheckCircle2,   tone: TONE.green, href: "/candidates?status=shortlisted" },
  ]

  return (
    <>
      <StatCards cards={cards} />

      <SectionCard
        title="Decisions to confirm"
        action={
          <Link href="/candidates?actionRequired=1" className="text-xs font-medium text-brand hover:underline">
            View all
          </Link>
        }
      >
        {reviews.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Nothing waiting — teacher decisions appear here once a CV has been scanned.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {reviews.slice(0, 6).map((r) => (
              <li key={r.reviewId} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={r.candidate} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.candidate}</p>
                  <p className="text-xs text-muted-foreground">by {r.teacher} · {r.subject}</p>
                </div>
                <VerdictBadge verdict={r.verdict} />
                <Link
                  href={`/candidates?open=${r.candidateId}&tab=reviews`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                >
                  Confirm <ArrowRight className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

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
            Nothing cleared yet — candidates arrive here once you confirm a teacher's decision.
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
                  href={`/candidates?open=${c.id}&tab=interviews`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <CalendarPlus className="size-3.5" /> Schedule interviews
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </>
  )
}

// ── Master admin: everything Admin L2 has, plus people/roles and oversight ─────

async function MasterAdminDashboard() {
  const [data, reviews, workload] = await Promise.all([
    getAdminDashboardData(),
    getPendingReviews(),
    getTeacherWorkload(),
  ])

  return (
    <>
      <Topbar title="Dashboard" showDate />
      <div className="space-y-6 p-6">
        <AdminOperationalBlock data={data} reviews={reviews} />

        <SectionCard title="Teacher Assignments">
          <SortableTeacherAssignmentsTable rows={workload} />
        </SectionCard>

        <CandidatePipeline stages={data.pipeline} total={data.totalCandidates} />
      </div>
    </>
  )
}

// ── Admin L2: the day-to-day work queues, nothing else ──────────────────────────

async function AdminL2Dashboard() {
  const [data, reviews] = await Promise.all([getAdminDashboardData(), getPendingReviews()])

  return (
    <>
      <Topbar title="Dashboard" showDate />
      <div className="space-y-6 p-6">
        <AdminOperationalBlock data={data} reviews={reviews} />
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
