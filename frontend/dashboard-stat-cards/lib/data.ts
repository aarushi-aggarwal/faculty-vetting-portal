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

/** One row of the admin Candidates table — the backend derives assignedTo/actionNeeded. */
export interface CandidateBoardRow {
  id: string
  name: string
  email: string
  subject: string
  experienceYears: number
  status: CvStatus
  assignedTo: string[]
  actionNeeded: string
  actionHighlight: boolean
  updatedAt: string
  createdAt: string
}

export interface CandidateHistoryEntry {
  fromStatus: string | null
  toStatus: string
  changedByName: string | null
  reason: string | null
  changedAt: string
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

/** What an admin did with that call. Reverting inverts the outcome; reassigning sends it to another teacher. */
export type AdminAction = "accepted" | "overridden" | "reassigned"

/** Where the candidate lands once the admin has acted. */
export type DecisionOutcome = "interview" | "archive" | "reassigned"

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

export type ParticipantRole = "lead" | "co_interviewer" | "observer"
export type InterviewOutcome = "proceed" | "hold" | "reject"

export interface PanelMember {
  userId: string
  name: string
  role: ParticipantRole
  outcome?: InterviewOutcome | null
  strengths?: string | null
  concerns?: string | null
  feedbackSubmittedAt?: string | null
}

export interface Interview {
  id: string
  candidateId?: string
  candidate: string
  candidateEmail?: string
  round: number
  status: InterviewStatus
  date: string
  time: string
  /** Raw ISO start time — kept alongside the formatted date/time for accurate sorting. */
  startTime: string
  location?: string
  meetingLink?: string | null
  panel: PanelMember[]
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
