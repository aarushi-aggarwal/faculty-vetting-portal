import type {
  AssignmentStatus,
  CvStatus,
  InterviewStatus,
  Priority,
  RoleKey,
} from "@/lib/data"

export interface BadgeStyle {
  label: string
  className: string
}

/** Shown for any value the backend sends that we have no styling for. Never throw. */
export const fallbackBadge: BadgeStyle = {
  label: "Unknown",
  className: "bg-slate-100 text-slate-600 ring-slate-300",
}

// Muted, low-chroma palette — a formal register rather than dashboard-bright.
const NEUTRAL = "bg-slate-100 text-slate-700 ring-slate-300"
const STEEL   = "bg-[#e8edf2] text-[#33506a] ring-[#c2d0dd]"
const AMBER   = "bg-[#f6efe0] text-[#7a5c1e] ring-[#e3d3ae]"
const GREEN   = "bg-[#e6efe8] text-[#2f5d40] ring-[#c2d8c9]"
const RED     = "bg-[#f5e9e9] text-[#8c3130] ring-[#e0c4c3]"
const STONE   = "bg-[#eeeceb] text-[#5f5954] ring-[#d8d3cf]"

export const statusConfig: Record<CvStatus, BadgeStyle> = {
  uploaded:            { label: "Uploaded", className: NEUTRAL },
  pending_assignment:  { label: "Pending Assignment", className: AMBER },
  assigned:            { label: "Assigned", className: STEEL },
  under_review:        { label: "Under Review", className: STEEL },
  pending_decision:    { label: "Awaiting Admin", className: AMBER },
  shortlisted:         { label: "Cleared for Interview", className: GREEN },
  interview_scheduled: { label: "Interview Scheduled", className: STEEL },
  interview_done:      { label: "Interview Done", className: STEEL },
  offer_pending:       { label: "Offer Pending", className: AMBER },
  accepted:            { label: "Accepted", className: GREEN },
  rejected:            { label: "Rejected", className: RED },
  on_hold:             { label: "Archived", className: STONE },
}

export const pipelineBarColor: Record<CvStatus, string> = {
  uploaded: "bg-slate-400",
  pending_assignment: "bg-[#b99b53]",
  assigned: "bg-[#6b87a3]",
  under_review: "bg-[#54718e]",
  pending_decision: "bg-[#a8873f]",
  shortlisted: "bg-[#4a7a5b]",
  interview_scheduled: "bg-[#3e5c76]",
  interview_done: "bg-[#33506a]",
  offer_pending: "bg-[#b99b53]",
  accepted: "bg-[#2f5d40]",
  rejected: "bg-[#a1504e]",
  on_hold: "bg-stone-400",
}

export const priorityConfig: Record<Priority, BadgeStyle> = {
  urgent: { label: "Urgent", className: RED },
  high:   { label: "High", className: AMBER },
  normal: { label: "Normal", className: NEUTRAL },
}

export const roleConfig: Record<RoleKey, BadgeStyle & { avatar: string }> = {
  master_admin: { label: "Master Admin", className: "bg-[#24292f] text-white ring-[#24292f]", avatar: "bg-[#24292f]" },
  admin_l2:     { label: "Admin L2", className: "bg-[#3e5c76] text-white ring-[#3e5c76]", avatar: "bg-[#3e5c76]" },
  teacher:      { label: "Teacher", className: NEUTRAL, avatar: "bg-slate-500" },
}

export const assignmentStatusConfig: Record<AssignmentStatus, BadgeStyle> = {
  pending:   { label: "Pending", className: AMBER },
  in_review: { label: "In Review", className: STEEL },
  completed: { label: "Scanned", className: GREEN },
  declined:  { label: "Declined", className: RED },
}

export const interviewStatusConfig: Record<InterviewStatus, BadgeStyle & { accent: string }> = {
  scheduled:   { label: "Scheduled", className: STEEL, accent: "border-l-[#3e5c76]" },
  in_progress: { label: "In Progress", className: STEEL, accent: "border-l-[#54718e]" },
  completed:   { label: "Completed", className: GREEN, accent: "border-l-[#4a7a5b]" },
  cancelled:   { label: "Cancelled", className: RED, accent: "border-l-[#a1504e]" },
  rescheduled: { label: "Rescheduled", className: AMBER, accent: "border-l-[#b99b53]" },
}

/** A teacher's verdict on a scanned CV. */
export const verdictConfig: Record<string, BadgeStyle> = {
  shortlist: { label: "Shortlisted", className: GREEN },
  reject:    { label: "Not shortlisted", className: RED },
}

/** What the admin did with that verdict. */
export const adminActionConfig: Record<string, BadgeStyle> = {
  accepted:   { label: "Accepted", className: GREEN },
  overridden: { label: "Overridden", className: AMBER },
}

/** Where the candidate ended up once the admin acted. */
export const outcomeConfig: Record<string, BadgeStyle> = {
  interview: { label: "To interview", className: GREEN },
  archive:   { label: "Archived", className: STONE },
  proceed:   { label: "Proceed", className: GREEN },
  hold:      { label: "Hold", className: AMBER },
  reject:    { label: "Reject", className: RED },
}

export function initials(name: string): string {
  const clean = (name ?? "").replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s*/i, "").trim()
  const parts = clean.split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}
