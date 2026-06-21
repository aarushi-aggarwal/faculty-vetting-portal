import { useEffect, useState } from 'react'
import { getAssignments, createAssignment } from '../api/assignments'
import { getCandidates } from '../api/candidates'

export default function Assignments() {
  const [assignments, setAssignments] = useState([])
  const [candidates, setCandidates] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ cv_id: '', candidate_id: '', teacher_id: '', priority: 'normal', due_date: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAssignments(), getCandidates()])
      .then(([a, c]) => { setAssignments(a.data); setCandidates(c.data) })
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    await createAssignment(form)
    const r = await getAssignments()
    setAssignments(r.data)
    setShowForm(false)
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Assignments</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
          New Assignment
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Assign CV to Teacher</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            {[
              ['cv_id', 'CV ID'],
              ['candidate_id', 'Candidate ID'],
              ['teacher_id', 'Teacher User ID'],
              ['due_date', 'Due Date'],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  type={field === 'due_date' ? 'date' : 'text'}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm">Assign</button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-gray-300 px-4 py-2 rounded text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="p-4 font-medium">Candidate</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Priority</th>
              <th className="p-4 font-medium">Due Date</th>
              <th className="p-4 font-medium">Assigned</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 text-gray-900">{a.candidate_id}</td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">{a.status}</span>
                </td>
                <td className="p-4 text-gray-500 capitalize">{a.priority}</td>
                <td className="p-4 text-gray-500">{a.due_date || '—'}</td>
                <td className="p-4 text-gray-500">{new Date(a.assigned_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}