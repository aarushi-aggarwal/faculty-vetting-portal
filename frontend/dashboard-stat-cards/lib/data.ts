// Central mock data + domain types for the Faculty Vetting Portal.

export type CvStatus =
  | "uploaded"
  | "pending_assignment"
  | "assigned"
  | "under_review"
  | "shortlisted"
  | "interview_scheduled"
  | "interview_done"
  | "offer_pending"
  | "accepted"
  | "rejected"
  | "on_hold"

export type Priority = "urgent" | "high" | "normal"

export type RoleKey = "master_admin" | "admin_l2" | "teacher"

export type AssignmentStatus =
  | "pending"
  | "pending_acceptance"
  | "in_review"
  | "completed"
  | "declined"

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

export interface Reviewer {
  reviewerName: string
  verdict: "shortlist" | "reject" | "flag"
  rating: number
  strengths: string
  concerns: string
  scores: { domain: number; communication: number; experience: number; availability: number }
  date: string
}

export interface FlagItem {
  id: string
  type: "declined" | "overdue" | "stalled"
  candidate: string
  description: string
  timestamp: string
}

export interface WorkloadRow {
  teacher: string
  assigned: number
  reviewed: number
  pending: number
  overdue: number
  avgReviewTime: string
}

export interface ActivityItem {
  id: string
  actor: string
  action: string
  timestamp: string
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
}

export interface Interview {
  id: string
  candidate: string
  candidateEmail?: string
  round?: number
  status: InterviewStatus
  date: string
  time: string
  duration?: string
  location: string
  platform?: string
  interviewers?: { name: string; role: "Lead" | "Co-interviewer" | "Observer" }[]
  outcomes?: { name: string; verdict: "proceed" | "hold" | "reject" }[]
  scheduledBy?: string
}

export interface QueueItem {
  id: string
  candidate: string
  subject: string
  experienceYears: number
  assignedDate: string
  dueDate: string
  overdue: boolean
  priority: Priority
  status: AssignmentStatus
  declineReason?: string
}

// ---------- Dashboard ----------

export const dashboardStats = [
  { label: "Total CVs", value: 600, tone: "slate", icon: "FileText" },
  { label: "Pending Assignment", value: 45, tone: "yellow", icon: "Clock" },
  { label: "Under Review", value: 120, tone: "purple", icon: "Search" },
  { label: "Shortlisted", value: 89, tone: "green", icon: "CheckCircle2" },
  { label: "Interviews Scheduled", value: 34, tone: "blue", icon: "CalendarClock" },
] as const

export const pipeline: { stage: string; count: number; status: CvStatus }[] = [
  { stage: "Uploaded", count: 600, status: "uploaded" },
  { stage: "Pending Assignment", count: 45, status: "pending_assignment" },
  { stage: "Assigned", count: 210, status: "assigned" },
  { stage: "Under Review", count: 120, status: "under_review" },
  { stage: "Shortlisted", count: 89, status: "shortlisted" },
  { stage: "Interview Scheduled", count: 34, status: "interview_scheduled" },
  { stage: "Interview Done", count: 28, status: "interview_done" },
  { stage: "Offer Pending", count: 16, status: "offer_pending" },
  { stage: "Accepted", count: 11, status: "accepted" },
  { stage: "Rejected", count: 64, status: "rejected" },
]

export const flagQueue: FlagItem[] = [
  {
    id: "f1",
    type: "declined",
    candidate: "Rohan Deshmukh",
    description: "Dr. Kavita Rao declined the assignment — reason: subject mismatch.",
    timestamp: "12 min ago",
  },
  {
    id: "f2",
    type: "overdue",
    candidate: "Sneha Iyer",
    description: "Review overdue by 4 days with Dr. Anil Kumar.",
    timestamp: "1 hour ago",
  },
  {
    id: "f3",
    type: "stalled",
    candidate: "Vikram Nair",
    description: "No action for 9 days — stuck in Under Review.",
    timestamp: "3 hours ago",
  },
  {
    id: "f4",
    type: "declined",
    candidate: "Meera Joshi",
    description: "Dr. Suresh Pillai declined — reason: at capacity this week.",
    timestamp: "5 hours ago",
  },
  {
    id: "f5",
    type: "overdue",
    candidate: "Aditya Verma",
    description: "Review overdue by 2 days with Dr. Priya Sharma.",
    timestamp: "Yesterday",
  },
]

export const teacherWorkload: WorkloadRow[] = [
  { teacher: "Dr. Priya Sharma", assigned: 12, reviewed: 9, pending: 3, overdue: 1, avgReviewTime: "1.8 days" },
  { teacher: "Dr. Anil Kumar", assigned: 10, reviewed: 6, pending: 4, overdue: 2, avgReviewTime: "2.4 days" },
  { teacher: "Dr. Kavita Rao", assigned: 8, reviewed: 8, pending: 0, overdue: 0, avgReviewTime: "1.2 days" },
  { teacher: "Dr. Suresh Pillai", assigned: 14, reviewed: 7, pending: 7, overdue: 3, avgReviewTime: "3.1 days" },
  { teacher: "Dr. Neha Gupta", assigned: 9, reviewed: 9, pending: 0, overdue: 0, avgReviewTime: "1.5 days" },
  { teacher: "Dr. Rajesh Menon", assigned: 11, reviewed: 8, pending: 3, overdue: 0, avgReviewTime: "2.0 days" },
]

export const recentActivity: ActivityItem[] = [
  { id: "a1", actor: "Dr. Priya Sharma", action: "shortlisted Arjun Mehta", timestamp: "8 min ago" },
  { id: "a2", actor: "Admin L2 — Ravi Shah", action: "assigned 6 CVs to Dr. Neha Gupta", timestamp: "22 min ago" },
  { id: "a3", actor: "Dr. Kavita Rao", action: "declined assignment for Rohan Deshmukh", timestamp: "35 min ago" },
  { id: "a4", actor: "Dr. Anil Kumar", action: "submitted a review for Sneha Iyer", timestamp: "1 hour ago" },
  { id: "a5", actor: "Master Admin — Dr. Asha Reddy", action: "scheduled Round 2 for Kabir Khan", timestamp: "2 hours ago" },
  { id: "a6", actor: "Dr. Neha Gupta", action: "flagged Vikram Nair for discussion", timestamp: "3 hours ago" },
  { id: "a7", actor: "Admin L2 — Ravi Shah", action: "moved Aditya Verma to Offer Pending", timestamp: "4 hours ago" },
  { id: "a8", actor: "Dr. Rajesh Menon", action: "completed interview for Meera Joshi", timestamp: "Yesterday" },
]

// ---------- Candidates ----------

export const candidates: Candidate[] = [
  { id: "c1", name: "Arjun Mehta", email: "arjun.mehta@email.com", phone: "+91 98200 11234", subject: "Computer Science", experienceYears: 6, qualification: "Ph.D. Computer Science, IIT Bombay", employer: "Persistent Systems", status: "shortlisted", uploadedOn: "Jun 02, 2026" },
  { id: "c2", name: "Sneha Iyer", email: "sneha.iyer@email.com", phone: "+91 99000 45678", subject: "Mathematics", experienceYears: 4, qualification: "Ph.D. Applied Mathematics, IISc", employer: "Christ University", status: "under_review", uploadedOn: "Jun 05, 2026" },
  { id: "c3", name: "Rohan Deshmukh", email: "rohan.d@email.com", phone: "+91 98765 33221", subject: "Physics", experienceYears: 8, qualification: "Ph.D. Condensed Matter Physics, TIFR", employer: "Fergusson College", status: "pending_assignment", uploadedOn: "Jun 10, 2026" },
  { id: "c4", name: "Meera Joshi", email: "meera.joshi@email.com", phone: "+91 90040 55667", subject: "Economics", experienceYears: 5, qualification: "Ph.D. Economics, Delhi School of Economics", employer: "St. Xavier's College", status: "interview_scheduled", uploadedOn: "Jun 08, 2026" },
  { id: "c5", name: "Vikram Nair", email: "vikram.nair@email.com", phone: "+91 99887 22110", subject: "Chemistry", experienceYears: 3, qualification: "Ph.D. Organic Chemistry, University of Hyderabad", employer: "Loyola College", status: "under_review", uploadedOn: "Jun 11, 2026" },
  { id: "c6", name: "Aditya Verma", email: "aditya.verma@email.com", phone: "+91 98111 90876", subject: "Computer Science", experienceYears: 9, qualification: "Ph.D. Machine Learning, IIT Delhi", employer: "TCS Research", status: "offer_pending", uploadedOn: "May 28, 2026" },
  { id: "c7", name: "Kabir Khan", email: "kabir.khan@email.com", phone: "+91 97000 12345", subject: "English Literature", experienceYears: 7, qualification: "Ph.D. Postcolonial Literature, JNU", employer: "Jadavpur University", status: "interview_done", uploadedOn: "Jun 01, 2026" },
  { id: "c8", name: "Ananya Das", email: "ananya.das@email.com", phone: "+91 98300 67890", subject: "Biology", experienceYears: 2, qualification: "Ph.D. Molecular Biology, NCBS", employer: "Ashoka University", status: "assigned", uploadedOn: "Jun 12, 2026" },
  { id: "c9", name: "Farhan Qureshi", email: "farhan.q@email.com", phone: "+91 99100 44556", subject: "Mechanical Engineering", experienceYears: 11, qualification: "Ph.D. Thermal Engineering, IIT Madras", employer: "L&T Technology", status: "accepted", uploadedOn: "May 20, 2026" },
  { id: "c10", name: "Divya Menon", email: "divya.menon@email.com", phone: "+91 98456 78123", subject: "History", experienceYears: 6, qualification: "Ph.D. Modern Indian History, JNU", employer: "Presidency University", status: "rejected", uploadedOn: "Jun 03, 2026" },
  { id: "c11", name: "Sahil Kapoor", email: "sahil.kapoor@email.com", phone: "+91 97800 33445", subject: "Statistics", experienceYears: 4, qualification: "Ph.D. Statistics, ISI Kolkata", employer: "Flipkart Data Science", status: "uploaded", uploadedOn: "Jun 18, 2026" },
  { id: "c12", name: "Ritu Agarwal", email: "ritu.agarwal@email.com", phone: "+91 99220 11778", subject: "Psychology", experienceYears: 5, qualification: "Ph.D. Clinical Psychology, NIMHANS", employer: "FLAME University", status: "on_hold", uploadedOn: "Jun 06, 2026" },
]

export const candidateReviews: Record<string, Reviewer[]> = {
  c1: [
    { reviewerName: "Dr. Priya Sharma", verdict: "shortlist", rating: 5, strengths: "Strong systems background, multiple top-tier publications, clear teaching philosophy.", concerns: "Limited prior undergraduate teaching exposure.", scores: { domain: 5, communication: 4, experience: 5, availability: 4 }, date: "Jun 14, 2026" },
    { reviewerName: "Dr. Rajesh Menon", verdict: "shortlist", rating: 4, strengths: "Excellent grasp of distributed systems; mentored several juniors.", concerns: "Availability only from August onward.", scores: { domain: 5, communication: 4, experience: 4, availability: 3 }, date: "Jun 15, 2026" },
    { reviewerName: "Dr. Neha Gupta", verdict: "flag", rating: 4, strengths: "Research depth is impressive.", concerns: "Wants to confirm long-term commitment in interview.", scores: { domain: 4, communication: 4, experience: 4, availability: 3 }, date: "Jun 15, 2026" },
  ],
}

// ---------- Users ----------

export const userSummary = { total: 48, masterAdmins: 2, adminL2: 5, teachers: 41 }

export const portalUsers: PortalUser[] = [
  { id: "u1", name: "Dr. Priya Sharma", email: "priya.sharma@univ.edu", department: "Computer Science", roles: ["teacher", "admin_l2"], bandwidthUsed: 8, bandwidthMax: 12, assigned: 12, reviewed: 9, interviews: 5, active: true },
  { id: "u2", name: "Dr. Asha Reddy", email: "asha.reddy@univ.edu", department: "Administration", roles: ["master_admin", "teacher"], bandwidthUsed: 2, bandwidthMax: 6, assigned: 2, reviewed: 2, interviews: 9, active: true },
  { id: "u3", name: "Ravi Shah", email: "ravi.shah@univ.edu", department: "Operations", roles: ["admin_l2"], bandwidthUsed: 0, bandwidthMax: 0, assigned: 0, reviewed: 0, interviews: 3, active: true },
  { id: "u4", name: "Dr. Anil Kumar", email: "anil.kumar@univ.edu", department: "Mathematics", roles: ["teacher"], bandwidthUsed: 10, bandwidthMax: 10, assigned: 10, reviewed: 6, interviews: 2, active: true },
  { id: "u5", name: "Dr. Kavita Rao", email: "kavita.rao@univ.edu", department: "Physics", roles: ["teacher"], bandwidthUsed: 4, bandwidthMax: 12, assigned: 8, reviewed: 8, interviews: 4, active: true },
  { id: "u6", name: "Dr. Suresh Pillai", email: "suresh.pillai@univ.edu", department: "Chemistry", roles: ["teacher"], bandwidthUsed: 12, bandwidthMax: 12, assigned: 14, reviewed: 7, interviews: 1, active: false },
  { id: "u7", name: "Dr. Neha Gupta", email: "neha.gupta@univ.edu", department: "Biology", roles: ["teacher", "admin_l2"], bandwidthUsed: 5, bandwidthMax: 12, assigned: 9, reviewed: 9, interviews: 6, active: true },
  { id: "u8", name: "Dr. Rajesh Menon", email: "rajesh.menon@univ.edu", department: "Computer Science", roles: ["teacher"], bandwidthUsed: 7, bandwidthMax: 15, assigned: 11, reviewed: 8, interviews: 3, active: true },
  { id: "u9", name: "Dr. Sunita Bose", email: "sunita.bose@univ.edu", department: "Economics", roles: ["teacher"], bandwidthUsed: 3, bandwidthMax: 10, assigned: 6, reviewed: 5, interviews: 2, active: false },
]

// ---------- Assignments ----------

export const assignmentStats = [
  { label: "Total Assignments", value: 87, tone: "slate" },
  { label: "Pending", value: 23, tone: "yellow" },
  { label: "In Review", value: 31, tone: "purple" },
  { label: "Completed", value: 28, tone: "green" },
  { label: "Declined", value: 5, tone: "red" },
] as const

export const assignments: Assignment[] = [
  { id: "as1", candidate: "Arjun Mehta", subject: "Computer Science", teachers: ["Dr. Priya Sharma", "Dr. Rajesh Menon", "Dr. Neha Gupta"], priority: "high", status: "completed", dueDate: "Jun 14, 2026", overdue: false, assignedDate: "Jun 08, 2026" },
  { id: "as2", candidate: "Sneha Iyer", subject: "Mathematics", teachers: ["Dr. Anil Kumar"], priority: "urgent", status: "in_review", dueDate: "Jun 16, 2026", overdue: true, assignedDate: "Jun 09, 2026" },
  { id: "as3", candidate: "Rohan Deshmukh", subject: "Physics", teachers: ["Dr. Kavita Rao"], priority: "normal", status: "declined", dueDate: "Jun 18, 2026", overdue: false, assignedDate: "Jun 11, 2026" },
  { id: "as4", candidate: "Meera Joshi", subject: "Economics", teachers: ["Dr. Sunita Bose", "Dr. Rajesh Menon"], priority: "high", status: "completed", dueDate: "Jun 12, 2026", overdue: false, assignedDate: "Jun 06, 2026" },
  { id: "as5", candidate: "Vikram Nair", subject: "Chemistry", teachers: ["Dr. Suresh Pillai"], priority: "normal", status: "in_review", dueDate: "Jun 15, 2026", overdue: true, assignedDate: "Jun 11, 2026" },
  { id: "as6", candidate: "Aditya Verma", subject: "Computer Science", teachers: ["Dr. Priya Sharma"], priority: "urgent", status: "completed", dueDate: "Jun 03, 2026", overdue: false, assignedDate: "May 28, 2026" },
  { id: "as7", candidate: "Ananya Das", subject: "Biology", teachers: ["Dr. Neha Gupta"], priority: "normal", status: "pending", dueDate: "Jun 22, 2026", overdue: false, assignedDate: "Jun 12, 2026" },
  { id: "as8", candidate: "Kabir Khan", subject: "English Literature", teachers: ["Dr. Sunita Bose"], priority: "high", status: "completed", dueDate: "Jun 09, 2026", overdue: false, assignedDate: "Jun 01, 2026" },
  { id: "as9", candidate: "Ritu Agarwal", subject: "Psychology", teachers: ["Dr. Neha Gupta"], priority: "normal", status: "pending", dueDate: "Jun 24, 2026", overdue: false, assignedDate: "Jun 13, 2026" },
  { id: "as10", candidate: "Divya Menon", subject: "History", teachers: ["Dr. Anil Kumar"], priority: "normal", status: "in_review", dueDate: "Jun 17, 2026", overdue: false, assignedDate: "Jun 10, 2026" },
]

// ---------- Interviews ----------

export const interviewStats = [
  { label: "Total Scheduled", value: 34, tone: "slate" },
  { label: "Upcoming", value: 12, tone: "blue" },
  { label: "In Progress", value: 2, tone: "purple" },
  { label: "Completed", value: 18, tone: "green" },
  { label: "Cancelled", value: 2, tone: "red" },
] as const

export const interviews: Interview[] = [
  { id: "iv1", candidate: "Arjun Mehta", round: 1, status: "scheduled", date: "Jun 22, 2026", time: "10:00 AM", duration: "45 mins", platform: "Google Meet", interviewers: [{ name: "Dr. Asha Reddy", role: "Lead" }, { name: "Dr. Priya Sharma", role: "Co-interviewer" }] },
  { id: "iv2", candidate: "Meera Joshi", round: 1, status: "scheduled", date: "Jun 23, 2026", time: "02:30 PM", duration: "45 mins", platform: "Zoom", interviewers: [{ name: "Dr. Sunita Bose", role: "Lead" }, { name: "Ravi Shah", role: "Observer" }] },
  { id: "iv3", candidate: "Kabir Khan", round: 2, status: "in_progress", date: "Jun 20, 2026", time: "11:00 AM", duration: "60 mins", platform: "Google Meet", interviewers: [{ name: "Dr. Asha Reddy", role: "Lead" }, { name: "Dr. Rajesh Menon", role: "Co-interviewer" }] },
  { id: "iv4", candidate: "Aditya Verma", round: 2, status: "completed", date: "Jun 16, 2026", time: "03:00 PM", duration: "45 mins", platform: "Microsoft Teams", interviewers: [{ name: "Dr. Priya Sharma", role: "Lead" }, { name: "Dr. Neha Gupta", role: "Co-interviewer" }], outcomes: [{ name: "Dr. Priya Sharma", verdict: "proceed" }, { name: "Dr. Neha Gupta", verdict: "proceed" }] },
  { id: "iv5", candidate: "Farhan Qureshi", round: 1, status: "completed", date: "Jun 12, 2026", time: "09:30 AM", duration: "45 mins", platform: "Google Meet", interviewers: [{ name: "Dr. Rajesh Menon", role: "Lead" }, { name: "Dr. Anil Kumar", role: "Observer" }], outcomes: [{ name: "Dr. Rajesh Menon", verdict: "proceed" }, { name: "Dr. Anil Kumar", verdict: "hold" }] },
  { id: "iv6", candidate: "Sneha Iyer", round: 1, status: "rescheduled", date: "Jun 25, 2026", time: "01:00 PM", duration: "45 mins", platform: "In Person", interviewers: [{ name: "Dr. Anil Kumar", role: "Lead" }] },
]

// ---------- Teacher queue ----------

export const teacherQueue: QueueItem[] = [
  { id: "q1", candidate: "Sahil Kapoor", subject: "Statistics", experienceYears: 4, assignedDate: "Jun 18, 2026", dueDate: "Jun 24, 2026", overdue: false, priority: "high", status: "pending_acceptance" },
  { id: "q2", candidate: "Ananya Das", subject: "Biology", experienceYears: 2, assignedDate: "Jun 18, 2026", dueDate: "Jun 25, 2026", overdue: false, priority: "normal", status: "pending_acceptance" },
  { id: "q3", candidate: "Sneha Iyer", subject: "Mathematics", experienceYears: 4, assignedDate: "Jun 09, 2026", dueDate: "Jun 16, 2026", overdue: true, priority: "urgent", status: "in_review" },
  { id: "q4", candidate: "Vikram Nair", subject: "Chemistry", experienceYears: 3, assignedDate: "Jun 11, 2026", dueDate: "Jun 19, 2026", overdue: false, priority: "normal", status: "in_review" },
  { id: "q5", candidate: "Aditya Verma", subject: "Computer Science", experienceYears: 9, assignedDate: "Jun 12, 2026", dueDate: "Jun 17, 2026", overdue: true, priority: "high", status: "in_review" },
  { id: "q6", candidate: "Arjun Mehta", subject: "Computer Science", experienceYears: 6, assignedDate: "Jun 08, 2026", dueDate: "Jun 14, 2026", overdue: false, priority: "high", status: "completed" },
  { id: "q7", candidate: "Kabir Khan", subject: "English Literature", experienceYears: 7, assignedDate: "Jun 01, 2026", dueDate: "Jun 09, 2026", overdue: false, priority: "normal", status: "completed" },
  { id: "q8", candidate: "Rohan Deshmukh", subject: "Physics", experienceYears: 8, assignedDate: "Jun 11, 2026", dueDate: "Jun 18, 2026", overdue: false, priority: "normal", status: "declined", declineReason: "Subject is outside my area of expertise (Physics vs. my specialization in CS)." },
]

export function getCandidate(id: string): Candidate | undefined {
  return candidates.find((c) => c.id === id)
}
