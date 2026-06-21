import { useEffect, useState } from 'react'
import { getMyAssignments } from '../api/assignments'
import { useNavigate } from 'react-router-dom'

export default function Reviews() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getMyAssignments().then((r) => setAssignments(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">My Reviews</h1>
      <div className="bg-white border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="p-4 font-medium">Candidate</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Priority</th>
              <th className="p-4 font-medium">Due</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr
                key={a.id}
                onClick={() => navigate(`/candidates/${a.candidate_id}`)}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                <td className="p-4 text-blue-600">{a.candidate_id}</td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">{a.status}</span>
                </td>
                <td className="p-4 text-gray-500 capitalize">{a.priority}</td>
                <td className="p-4 text-gray-500">{a.due_date || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}