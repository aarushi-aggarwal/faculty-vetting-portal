// Domain types for the Faculty Vetting Portal. All data comes from the FastAPI
// backend via lib/fastapi-queries.ts.

export type CvStatus =
  | "uploaded"
  | "pending_assignment"
  | "assigned"
  | "under_review"
  | "pending_decision"
  | "shortlisted"
  | "interview_scheduled"
  | "interview_done"
  | "offer_pending"
  | "accepted"
  | "rejected"
  | "on_hold"

export type Priority = "urgent" | "high" | "normal"

export type RoleKey = "master_admin" | "admin_l2" | "teacher"

/**
 * An assigned CV moves: pending → in_review (opened) → completed (scanned).
 * "declined" is legacy — teachers can no longer decline, but old rows still exist.
 */
export type AssignmentStatus = "pending" | "in_review" | "completed" | "declined"

export type InterviewStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rescheduled"

export interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  experienceYears: number
  qualification: string
  employer: string
  status: CvStatus
  uploadedOn: string
}

export interface WorkloadRow {
  teacherId: string
  teacher: string
  assigned: number
  reviewed: number
  pending: number
  interviewed: number
}

export interface PortalUser {
  id: string
  name: string
  email: string
  department: string
  roles: RoleKey[]
  bandwidthUsed: number
  bandwidthMax: number
  assigned: number
  reviewed: number
  interviews: number
  active: boolean
}

/** A teacher's call on a scanned CV. */
export type Verdict = "shortlist" | "reject"

/** What an admin did with that call. Overriding inverts the outcome. */
export type AdminAction = "accepted" | "overridden"

/** Where the candidate lands once the admin has acted. */
export type DecisionOutcome = "interview" | "archive"

export interface Assignment {
  id: string
  candidateId?: string
  candidate: string
  subject?: string
  teachers: string[]
  priority: Priority
  status: AssignmentStatus
  dueDate: string
  overdue?: boolean
  assignedDate: string
  verdict?: Verdict | null
  reasoning?: string | null
  adminAction?: AdminAction | null
  outcome?: DecisionOutcome | null
  completedDate?: string | null
}

/** A teacher verdict sitting on an admin's desk, awaiting accept-or-override. */
export interface PendingReview {
  reviewId: string
  candidateId: string
  candidate: string
  subject: string
  teacher: string
  verdict: Verdict
  reasoning: string
  submittedOn: string
}

export interface Interview {
  id: string
  candidate: string
  candidateEmail?: string
  round?: number
  status: InterviewStatus
  date: string
  time: string
  location?: string
  platform?: string
  interviewers?: { name: string; role: "Lead" | "Co-interviewer" | "Observer" }[]
}

/** The stages the candidate pipeline is charted by — counts come from the API. */
export const pipelineStages: { stage: string; status: CvStatus }[] = [
  { stage: "Pending Assignment", status: "pending_assignment" },
  { stage: "With Teachers", status: "assigned" },
  { stage: "Being Scanned", status: "under_review" },
  { stage: "Awaiting Admin Decision", status: "pending_decision" },
  { stage: "Cleared for Interview", status: "shortlisted" },
  { stage: "Interview Scheduled", status: "interview_scheduled" },
  { stage: "Interview Done", status: "interview_done" },
  { stage: "Offer Pending", status: "offer_pending" },
  { stage: "Accepted", status: "accepted" },
  { stage: "Rejected", status: "rejected" },
]
