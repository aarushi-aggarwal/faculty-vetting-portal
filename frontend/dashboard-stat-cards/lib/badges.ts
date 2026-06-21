import type {
  AssignmentStatus,
  CvStatus,
  InterviewStatus,
  Priority,
  RoleKey,
} from "@/lib/data"

export const statusConfig: Record<CvStatus, { label: string; className: string }> = {
  uploaded: { label: "Uploaded", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  pending_assignment: { label: "Pending Assignment", className: "bg-amber-100 text-amber-800 ring-amber-200" },
  assigned: { label: "Assigned", className: "bg-blue-100 text-blue-700 ring-blue-200" },
  under_review: { label: "Under Review", className: "bg-purple-100 text-purple-700 ring-purple-200" },
  shortlisted: { label: "Shortlisted", className: "bg-green-100 text-green-700 ring-green-200" },
  interview_scheduled: { label: "Interview Scheduled", className: "bg-indigo-100 text-indigo-700 ring-indigo-200" },
  interview_done: { label: "Interview Done", className: "bg-teal-100 text-teal-700 ring-teal-200" },
  offer_pending: { label: "Offer Pending", className: "bg-orange-100 text-orange-700 ring-orange-200" },
  accepted: { label: "Accepted", className: "bg-emerald-200 text-emerald-900 ring-emerald-300" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 ring-red-200" },
  on_hold: { label: "On Hold", className: "bg-gray-200 text-gray-700 ring-gray-300" },
}

export const pipelineBarColor: Record<CvStatus, string> = {
  uploaded: "bg-slate-400",
  pending_assignment: "bg-amber-400",
  assigned: "bg-blue-400",
  under_review: "bg-purple-400",
  shortlisted: "bg-green-500",
  interview_scheduled: "bg-indigo-400",
  interview_done: "bg-teal-400",
  offer_pending: "bg-orange-400",
  accepted: "bg-emerald-500",
  rejected: "bg-red-400",
  on_hold: "bg-gray-400",
}

export const priorityConfig: Record<Priority, { label: string; className: string }> = {
  urgent: { label: "Urgent", className: "bg-red-100 text-red-700 ring-red-200" },
  high: { label: "High", className: "bg-orange-100 text-orange-700 ring-orange-200" },
  normal: { label: "Normal", className: "bg-slate-100 text-slate-600 ring-slate-200" },
}

export const roleConfig: Record<RoleKey, { label: string; className: string; avatar: string }> = {
  master_admin: { label: "Master Admin", className: "bg-[#1b3a6b] text-white ring-[#1b3a6b]", avatar: "bg-[#1b3a6b]" },
  admin_l2: { label: "Admin L2", className: "bg-blue-600 text-white ring-blue-600", avatar: "bg-blue-600" },
  teacher: { label: "Teacher", className: "bg-slate-200 text-slate-700 ring-slate-300", avatar: "bg-slate-500" },
}

export const assignmentStatusConfig: Record<
  AssignmentStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800 ring-amber-200" },
  pending_acceptance: { label: "Pending Acceptance", className: "bg-amber-100 text-amber-800 ring-amber-200" },
  in_review: { label: "In Review", className: "bg-purple-100 text-purple-700 ring-purple-200" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700 ring-green-200" },
  declined: { label: "Declined", className: "bg-red-100 text-red-700 ring-red-200" },
}

export const interviewStatusConfig: Record<
  InterviewStatus,
  { label: string; className: string; accent: string }
> = {
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 ring-blue-200", accent: "border-l-blue-500" },
  in_progress: { label: "In Progress", className: "bg-purple-100 text-purple-700 ring-purple-200", accent: "border-l-purple-500" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700 ring-green-200", accent: "border-l-green-500" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 ring-red-200", accent: "border-l-red-500" },
  rescheduled: { label: "Rescheduled", className: "bg-amber-100 text-amber-800 ring-amber-200", accent: "border-l-amber-500" },
}

export const outcomeConfig: Record<string, { label: string; className: string }> = {
  proceed: { label: "Proceed", className: "bg-green-100 text-green-700 ring-green-200" },
  hold: { label: "Hold", className: "bg-amber-100 text-amber-800 ring-amber-200" },
  reject: { label: "Reject", className: "bg-red-100 text-red-700 ring-red-200" },
}

export function initials(name: string): string {
  const clean = name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s*/i, "").trim()
  const parts = clean.split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase()
}
