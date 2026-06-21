import { createClient } from "@/lib/supabase/server"
import type { Candidate, Assignment, Interview, PortalUser } from "./data"

// ============================================================================
// CANDIDATES
// ============================================================================

export async function getCandidates(): Promise<Candidate[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[supabase] getCandidates error:", error)
    return []
  }

  return (data || []).map((c) => ({
    id: c.id,
    name: c.full_name,
    email: c.email,
    phone: c.phone || "",
    subject: c.preferred_subject || "N/A",
    experienceYears: c.years_experience || 0,
    qualification: c.highest_qualification || "N/A",
    employer: c.current_employer || "N/A",
    status: (c.current_status?.toLowerCase() as any) || "uploaded",
    uploadedOn: new Date(c.created_at).toLocaleDateString(),
  }))
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (error) {
    console.error("[supabase] getCandidateById error:", error)
    return null
  }

  return {
    id: data.id,
    name: data.full_name,
    email: data.email,
    phone: data.phone || "",
    subject: data.preferred_subject || "N/A",
    experienceYears: data.years_experience || 0,
    qualification: data.highest_qualification || "N/A",
    employer: data.current_employer || "N/A",
    status: (data.current_status?.toLowerCase() as any) || "uploaded",
    uploadedOn: new Date(data.created_at).toLocaleDateString(),
  }
}

// ============================================================================
// ASSIGNMENTS
// ============================================================================

export async function getAssignments(): Promise<Assignment[]> {
  const supabase = await createClient()

  // Get current user first
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // Check user roles
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role_id, roles(name)")
    .eq("user_id", user.id)
    .is("revoked_at", null)

  const isMasterAdmin = userRoles?.some(
    (ur) => (ur.roles as any)?.name === "master_admin"
  )
  const isAdmin = userRoles?.some((ur) =>
    ["master_admin", "admin_l2"].includes((ur.roles as any)?.name)
  )

  let query = supabase
    .from("assignments")
    .select(
      `
      id,
      candidate_id,
      teacher_id,
      priority,
      status,
      due_date,
      created_at,
      candidates(full_name, preferred_subject),
      profiles(full_name)
    `
    )
    .is("deleted_at", null)

  // Filter by user role
  if (!isAdmin) {
    query = query.eq("teacher_id", user.id)
  }

  const { data, error } = await query

  if (error) {
    console.error("[supabase] getAssignments error:", error)
    return []
  }

  return (data || []).map((a) => ({
    id: a.id,
    candidate: (a.candidates as any)?.full_name || "Unknown",
    subject: (a.candidates as any)?.preferred_subject || "N/A",
    teachers: [(a.profiles as any)?.full_name || "Unknown"],
    priority: (a.priority as any) || "normal",
    status: (a.status as any) || "pending",
    dueDate: a.due_date ? new Date(a.due_date).toLocaleDateString() : "N/A",
    overdue: a.due_date ? new Date(a.due_date) < new Date() : false,
    assignedDate: new Date(a.created_at).toLocaleDateString(),
  }))
}

// ============================================================================
// INTERVIEWS
// ============================================================================

export async function getInterviews(): Promise<Interview[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role_id, roles(name)")
    .eq("user_id", user.id)
    .is("revoked_at", null)

  const isAdmin = userRoles?.some((ur) =>
    ["master_admin", "admin_l2"].includes((ur.roles as any)?.name)
  )

  let query = supabase
    .from("interviews")
    .select(
      `
      id,
      candidate_id,
      interview_date,
      status,
      location,
      meeting_link,
      candidates(full_name, email),
      profiles(full_name)
    `
    )
    .is("deleted_at", null)
    .order("interview_date", { ascending: true })

  // Teachers only see their own interviews
  if (!isAdmin) {
    query = query.eq("scheduled_by", user.id)
  }

  const { data, error } = await query

  if (error) {
    console.error("[supabase] getInterviews error:", error)
    return []
  }

  return (data || []).map((i) => ({
    id: i.id,
    candidate: (i.candidates as any)?.full_name || "Unknown",
    candidateEmail: (i.candidates as any)?.email || "",
    scheduledBy: (i.profiles as any)?.full_name || "Unknown",
    date: i.interview_date ? new Date(i.interview_date).toLocaleDateString() : "N/A",
    time: i.interview_date ? new Date(i.interview_date).toLocaleTimeString() : "N/A",
    location: i.location || "Virtual",
    meetingLink: i.meeting_link || "",
    status: (i.status as any) || "scheduled",
  }))
}

// ============================================================================
// USERS
// ============================================================================

export async function getUsers(): Promise<PortalUser[]> {
  const supabase = await createClient()

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      email: auth.users(email),
      department,
      is_active,
      user_roles(roles(name)),
      user_bandwidth(max_assignments)
    `
    )
    .is("deleted_at", null)

  if (error) {
    console.error("[supabase] getUsers error:", error)
    return []
  }

  // Get assignment counts per user
  const { data: assignments } = await supabase
    .from("assignments")
    .select("teacher_id, status")
    .is("deleted_at", null)

  const assignmentCounts: Record<string, Record<string, number>> = {}
  ;(assignments || []).forEach((a) => {
    if (!assignmentCounts[a.teacher_id]) {
      assignmentCounts[a.teacher_id] = { assigned: 0, reviewed: 0, pending: 0 }
    }
    assignmentCounts[a.teacher_id].assigned++
    if (a.status === "completed") assignmentCounts[a.teacher_id].reviewed++
    if (a.status === "pending") assignmentCounts[a.teacher_id].pending++
  })

  return (profiles || []).map((p) => ({
    id: p.id,
    name: p.full_name,
    email: (p.email as any) || "",
    department: p.department || "N/A",
    roles: ((p.user_roles as any) || []).map((ur: any) => ur.roles?.name),
    bandwidthUsed: assignmentCounts[p.id]?.assigned || 0,
    bandwidthMax: ((p.user_bandwidth as any)?.[0]?.max_assignments) || 10,
    assigned: assignmentCounts[p.id]?.assigned || 0,
    reviewed: assignmentCounts[p.id]?.reviewed || 0,
    interviews: 0, // TODO: query interviews once participants are set up
    active: p.is_active,
  }))
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function getDashboardStats() {
  try {
    const supabase = await createClient()

    // Get candidates by status
    const { data: candidateData, error: candError } = await supabase
      .from("candidates")
      .select("id, current_status")
      .is("deleted_at", null)

    if (candError) {
      console.error("[supabase] getDashboardStats candidates error:", candError.message)
    }

    const candidates = candidateData || []
    const underReview = candidates.filter(
      (c) => c.current_status === "UNDER_REVIEW",
    ).length
    const shortlisted = candidates.filter(
      (c) => c.current_status === "SHORTLISTED",
    ).length

    // Get assignment counts
    const { data: assignmentData, error: assignError } = await supabase
      .from("assignments")
      .select("id, status")
      .is("deleted_at", null)

    if (assignError) {
      console.error(
        "[supabase] getDashboardStats assignments error:",
        assignError.message,
      )
    }

    const assignments = assignmentData || []
    const pendingAssignments = assignments.filter(
      (a) => a.status === "pending",
    ).length

    // Get interview counts
    const { data: interviewData, error: interError } = await supabase
      .from("interviews")
      .select("id, status")
      .is("deleted_at", null)

    if (interError) {
      console.error("[supabase] getDashboardStats interviews error:", interError.message)
    }

    const interviews = interviewData || []
    const completedInterviews = interviews.filter(
      (i) => i.status === "completed",
    ).length

    return {
      totalCandidates: candidates.length,
      underReview,
      shortlisted,
      pendingAssignments,
      completedInterviews,
    }
  } catch (err) {
    console.error("[supabase] getDashboardStats error:", err)
    return {
      totalCandidates: 0,
      underReview: 0,
      shortlisted: 0,
      pendingAssignments: 0,
      completedInterviews: 0,
    }
  }
}
