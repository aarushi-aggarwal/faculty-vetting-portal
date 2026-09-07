import { apiGet } from "@/lib/api-client"
import type {
  Candidate, Assignment, Interview, PortalUser, WorkloadRow, Verdict, CvStatus,
  AdminAction, DecisionOutcome, PendingReview, CandidateBoardRow, CandidateHistoryEntry,
  PanelMember, ParticipantRole, InterviewOutcome,
} from "@/lib/data"
import { pipelineStages } from "@/lib/data"

export type { CvStatus } from "@/lib/data"

// ---------- shape of FastAPI responses ----------

interface ApiCandidate {
  id: string
  full_name: string
  email: string
  phone: string | null
  preferred_subject: string | null
  years_experience: number | null
  highest_qualification: string | null
  current_employer: string | null
  current_status: string
  created_at: string
}

interface ApiAssignment {
  id: string
  candidate_id: string
  candidate_name: string
  candidate_subject: string | null
  teacher_id: string
  teacher_name: string
  priority: string
  status: string
  due_date: string | null
  assigned_at: string
  completed_at: string | null
  verdict: string | null
  reasoning: string | null
  admin_action: string | null
  outcome: string | null
  overdue: boolean
}

interface ApiPendingReview {
  review_id: string
  candidate_id: string
  candidate_name: string
  candidate_subject: string | null
  teacher_name: string
  verdict: string
  reasoning: string | null
  submitted_at: string | null
}

interface ApiWorkloadRow {
  teacher_id: string
  teacher_name: string
  assigned: number
  reviewed: number
  pending: number
  interviewed: number
}

interface ApiPanelMember {
  user_id: string
  name: string
  role: string
  outcome: string | null
  strengths: string | null
  concerns: string | null
  feedback_submitted_at: string | null
}

interface ApiInterview {
  id: string
  candidate_id: string
  candidate_name: string
  candidate_email: string
  round_number: number
  status: string
  start_time: string
  end_time: string
  meeting_platform: string | null
  meeting_link: string | null
  panel: ApiPanelMember[]
}

interface ApiUser {
  id: string
  email: string
  full_name: string
  is_active: boolean
  roles: string[]
}

interface ApiCandidateBoardRow {
  id: string
  full_name: string
  email: string
  preferred_subject: string | null
  years_experience: number | null
  current_status: string
  assigned_to: string[]
  action_needed: string
  action_highlight: boolean
  updated_at: string
  created_at: string
}

interface ApiCandidateHistoryEntry {
  from_status: string | null
  to_status: string
  changed_by_name: string | null
  reason: string | null
  changed_at: string
}

// ---------- mappers ----------

function mapCandidate(c: ApiCandidate): Candidate {
  return {
    id: c.id,
    name: c.full_name,
    email: c.email,
    phone: c.phone ?? "",
    subject: c.preferred_subject ?? "N/A",
    experienceYears: c.years_experience ?? 0,
    qualification: c.highest_qualification ?? "N/A",
    employer: c.current_employer ?? "N/A",
    status: (c.current_status.toLowerCase() as Candidate["status"]),
    uploadedOn: new Date(c.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })

function mapAssignment(a: ApiAssignment): Assignment {
  return {
    id: a.id,
    candidateId: a.candidate_id,
    candidate: a.candidate_name,
    subject: a.candidate_subject ?? "N/A",
    teachers: [a.teacher_name],
    priority: (a.priority as Assignment["priority"]),
    status: (a.status as Assignment["status"]),
    dueDate: a.due_date
      ? new Date(a.due_date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A",
    overdue: a.overdue,
    assignedDate: shortDate(a.assigned_at),
    verdict: (a.verdict as Verdict) ?? null,
    reasoning: a.reasoning ?? null,
    adminAction: (a.admin_action as AdminAction) ?? null,
    outcome: (a.outcome as DecisionOutcome) ?? null,
    completedDate: a.completed_at ? shortDate(a.completed_at) : null,
  }
}

function mapPanelMember(p: ApiPanelMember): PanelMember {
  return {
    userId: p.user_id,
    name: p.name,
    role: (p.role as ParticipantRole) ?? "co_interviewer",
    outcome: (p.outcome as InterviewOutcome) ?? null,
    strengths: p.strengths,
    concerns: p.concerns,
    feedbackSubmittedAt: p.feedback_submitted_at,
  }
}

function mapInterview(i: ApiInterview): Interview {
  const start = new Date(i.start_time)
  return {
    id: i.id,
    candidateId: i.candidate_id,
    candidate: i.candidate_name,
    candidateEmail: i.candidate_email,
    round: i.round_number,
    status: (i.status as Interview["status"]),
    date: start.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    startTime: i.start_time,
    location: i.meeting_platform ?? "Virtual",
    meetingLink: i.meeting_link,
    panel: (i.panel ?? []).map(mapPanelMember),
  }
}

function mapCandidateBoardRow(c: ApiCandidateBoardRow): CandidateBoardRow {
  return {
    id: c.id,
    name: c.full_name,
    email: c.email,
    subject: c.preferred_subject ?? "N/A",
    experienceYears: c.years_experience ?? 0,
    status: c.current_status.toLowerCase() as CvStatus,
    assignedTo: c.assigned_to,
    actionNeeded: c.action_needed,
    actionHighlight: c.action_highlight,
    updatedAt: c.updated_at,
    createdAt: c.created_at,
  }
}

function mapCandidateHistoryEntry(h: ApiCandidateHistoryEntry): CandidateHistoryEntry {
  return {
    fromStatus: h.from_status,
    toStatus: h.to_status,
    changedByName: h.changed_by_name,
    reason: h.reason,
    changedAt: h.changed_at,
  }
}

function mapUser(u: ApiUser): PortalUser {
  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    department: "N/A",
    roles: (u.roles as PortalUser["roles"]),
    bandwidthUsed: 0,
    bandwidthMax: 10,
    assigned: 0,
    reviewed: 0,
    interviews: 0,
    active: u.is_active,
  }
}

// ---------- query functions ----------

export async function getCandidates(): Promise<Candidate[]> {
  try {
    const data = await apiGet<ApiCandidate[]>("/candidates/")
    return data.map(mapCandidate)
  } catch (err) {
    console.error("[api] getCandidates error:", err)
    return []
  }
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  try {
    const data = await apiGet<ApiCandidate>(`/candidates/${id}`)
    return mapCandidate(data)
  } catch (err) {
    console.error("[api] getCandidateById error:", err)
    return null
  }
}

/** Everything the admin Candidates table needs, in one call. */
export async function getCandidateBoard(): Promise<CandidateBoardRow[]> {
  try {
    const data = await apiGet<ApiCandidateBoardRow[]>("/candidates/board")
    return data.map(mapCandidateBoardRow)
  } catch (err) {
    console.error("[api] getCandidateBoard error:", err)
    return []
  }
}

/** Full status-change timeline for one candidate, most recent first. */
export async function getCandidateHistory(id: string): Promise<CandidateHistoryEntry[]> {
  try {
    const data = await apiGet<ApiCandidateHistoryEntry[]>(`/candidates/${id}/history`)
    return data.map(mapCandidateHistoryEntry)
  } catch (err) {
    console.error("[api] getCandidateHistory error:", err)
    return []
  }
}

export async function getAssignments(): Promise<Assignment[]> {
  try {
    const data = await apiGet<ApiAssignment[]>("/assignments/")
    return data.map(mapAssignment)
  } catch (err) {
    console.error("[api] getAssignments error:", err)
    return []
  }
}

export async function getMyAssignments(): Promise<Assignment[]> {
  try {
    const data = await apiGet<ApiAssignment[]>("/assignments/my")
    return data.map(mapAssignment)
  } catch (err) {
    console.error("[api] getMyAssignments error:", err)
    return []
  }
}

export async function getInterviews(): Promise<Interview[]> {
  try {
    const data = await apiGet<ApiInterview[]>("/interviews/")
    return data.map(mapInterview)
  } catch (err) {
    console.error("[api] getInterviews error:", err)
    return []
  }
}

export async function getInterviewsForCandidate(candidateId: string): Promise<Interview[]> {
  try {
    const data = await apiGet<ApiInterview[]>(`/interviews/candidate/${candidateId}`)
    return data.map(mapInterview)
  } catch (err) {
    console.error("[api] getInterviewsForCandidate error:", err)
    return []
  }
}

export async function getMyInterviews(): Promise<Interview[]> {
  try {
    const data = await apiGet<ApiInterview[]>("/interviews/my")
    return data.map(mapInterview)
  } catch (err) {
    console.error("[api] getMyInterviews error:", err)
    return []
  }
}

export async function getUsers(): Promise<PortalUser[]> {
  try {
    const data = await apiGet<ApiUser[]>("/users/")
    return data.map(mapUser)
  } catch (err) {
    console.error("[api] getUsers error:", err)
    return []
  }
}

/** Teacher verdicts waiting for an admin to accept or override. */
export async function getPendingReviews(): Promise<PendingReview[]> {
  try {
    const data = await apiGet<ApiPendingReview[]>("/reviews/pending")
    return data.map((r) => ({
      reviewId: r.review_id,
      candidateId: r.candidate_id,
      candidate: r.candidate_name,
      subject: r.candidate_subject ?? "N/A",
      teacher: r.teacher_name,
      verdict: r.verdict as Verdict,
      reasoning: r.reasoning ?? "",
      submittedOn: r.submitted_at ? shortDate(r.submitted_at) : "—",
    }))
  } catch (err) {
    console.error("[api] getPendingReviews error:", err)
    return []
  }
}

export async function getTeacherWorkload(): Promise<WorkloadRow[]> {
  try {
    const data = await apiGet<ApiWorkloadRow[]>("/users/workload")
    return data.map((r) => ({
      teacherId: r.teacher_id,
      teacher: r.teacher_name,
      assigned: r.assigned,
      reviewed: r.reviewed,
      pending: r.pending,
      interviewed: r.interviewed,
    }))
  } catch (err) {
    console.error("[api] getTeacherWorkload error:", err)
    return []
  }
}

export interface AdminDashboardData {
  totalCandidates: number
  pipeline: { stage: string; status: CvStatus; count: number }[]
  awaitingAssignment: number
  outForReview: number
  /** Teacher verdicts sitting on the admin's desk. */
  awaitingDecision: number
  shortlisted: number
  interviewsScheduled: number
  interviewsDone: number
  /** Cleared candidates waiting to have an interview panel scheduled. */
  readyForInterview: Candidate[]
}

/** One round trip for everything both admin dashboards chart. */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [candResult, assignResult, ivResult] = await Promise.allSettled([
    apiGet<ApiCandidate[]>("/candidates/"),
    apiGet<ApiAssignment[]>("/assignments/"),
    apiGet<ApiInterview[]>("/interviews/"),
  ])

  const candidates = candResult.status === "fulfilled" ? candResult.value : []
  const assignments = assignResult.status === "fulfilled" ? assignResult.value : []
  const interviews = ivResult.status === "fulfilled" ? ivResult.value : []

  const countByStatus = (s: string) =>
    candidates.filter((c) => c.current_status === s).length

  return {
    totalCandidates: candidates.length,
    pipeline: pipelineStages.map((s) => ({
      ...s,
      count: countByStatus(s.status.toUpperCase()),
    })),
    awaitingAssignment: countByStatus("UPLOADED") + countByStatus("PENDING_ASSIGNMENT"),
    outForReview: assignments.filter((a) => ["pending", "in_review"].includes(a.status)).length,
    awaitingDecision: countByStatus("PENDING_DECISION"),
    shortlisted: countByStatus("SHORTLISTED"),
    interviewsScheduled: interviews.filter((i) => ["scheduled", "rescheduled"].includes(i.status)).length,
    interviewsDone: interviews.filter((i) => i.status === "completed").length,
    readyForInterview: candidates
      .filter((c) => c.current_status === "SHORTLISTED")
      .map(mapCandidate),
  }
}
