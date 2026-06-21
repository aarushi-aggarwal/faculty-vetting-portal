import { useEffect, useState } from 'react'
import { getCandidates } from '../api/candidates'
import { getAssignments } from '../api/assignments'
import StatusBadge from '../components/StatusBadge'

const STATUSES = [
  'UPLOADED', 'PENDING_ASSIGNMENT', 'ASSIGNED', 'UNDER_REVIEW',
  'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_DONE',
  'OFFER_PENDING', 'ACCEPTED', 'REJECTED', 'ON_HOLD'
]

export default function Dashboard() {
  const [candidates, setCandidates] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCandidates(), getAssignments()])
      .then(([c, a]) => {
        setCandidates(c.data)
        setAssignments(a.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const statusCounts = STATUSES.map((s) => ({
    status: s,
    count: candidates.filter((c) => c.current_status === s).length,
  })).filter((s) => s.count > 0)

  const overdue = assignments.filter(
    (a) => a.due_date && new Date(a.due_date) < new Date() && a.status === 'pending'
  )

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Candidates</p>
          <p className="text-3xl font-bold text-gray-900">{candidates.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Assignments</p>
          <p className="text-3xl font-bold text-gray-900">{assignments.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Overdue Reviews</p>
          <p className="text-3xl font-bold text-red-500">{overdue.length}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Pipeline Status</h2>
        <div className="flex flex-wrap gap-3">
          {statusCounts.map(({ status, count }) => (
            <div key={status} className="flex items-center gap-2">
              <StatusBadge status={status} />
              <span className="text-sm font-medium text-gray-700">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Recent Candidates</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Email</th>
              <th className="pb-2 font-medium">Subject</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {candidates.slice(0, 10).map((c) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 text-gray-900">{c.full_name}</td>
                <td className="py-2 text-gray-500">{c.email}</td>
                <td className="py-2 text-gray-500">{c.preferred_subject || '—'}</td>
                <td className="py-2"><StatusBadge status={c.current_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}