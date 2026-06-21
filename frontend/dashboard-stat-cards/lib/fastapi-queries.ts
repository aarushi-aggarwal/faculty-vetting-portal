import { apiGet } from "@/lib/api-client"
import type { Candidate, Assignment, Interview, PortalUser } from "@/lib/data"

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
  overdue: boolean
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
}

interface ApiUser {
  id: string
  email: string
  full_name: string
  is_active: boolean
  roles: string[]
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
    assignedDate: new Date(a.assigned_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }
}

function mapInterview(i: ApiInterview): Interview {
  const start = new Date(i.start_time)
  return {
    id: i.id,
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
    location: i.meeting_platform ?? "Virtual",
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

export async function getDashboardStats() {
  try {
    const [candResult, assignResult, ivResult] = await Promise.allSettled([
      apiGet<ApiCandidate[]>("/candidates/"),
      apiGet<ApiAssignment[]>("/assignments/"),
      apiGet<ApiInterview[]>("/interviews/"),
    ])

    const candidates = candResult.status === "fulfilled" ? candResult.value : []
    const assignments = assignResult.status === "fulfilled" ? assignResult.value : []
    const interviews = ivResult.status === "fulfilled" ? ivResult.value : []

    const underReview = candidates.filter(
      (c) => c.current_status === "UNDER_REVIEW"
    ).length
    const shortlisted = candidates.filter(
      (c) => c.current_status === "SHORTLISTED"
    ).length
    const pendingAssignments = assignments.filter(
      (a) => a.status === "pending"
    ).length
    const completedInterviews = interviews.filter(
      (i) => i.status === "completed"
    ).length

    return {
      totalCandidates: candidates.length,
      underReview,
      shortlisted,
      pendingAssignments,
      completedInterviews,
    }
  } catch (err) {
    console.error("[api] getDashboardStats error:", err)
    return {
      totalCandidates: 0,
      underReview: 0,
      shortlisted: 0,
      pendingAssignments: 0,
      completedInterviews: 0,
    }
  }
}
