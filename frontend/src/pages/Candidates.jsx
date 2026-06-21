import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCandidates, createCandidate } from '../api/candidates'
import StatusBadge from '../components/StatusBadge'

export default function Candidates() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', preferred_subject: '', years_experience: '', highest_qualification: '' })
  const navigate = useNavigate()

  useEffect(() => {
    getCandidates().then((r) => setCandidates(r.data)).finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    await createCandidate({ ...form, years_experience: Number(form.years_experience) || null })
    const r = await getCandidates()
    setCandidates(r.data)
    setShowForm(false)
    setForm({ full_name: '', email: '', phone: '', preferred_subject: '', years_experience: '', highest_qualification: '' })
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Candidates</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          Add Candidate
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">New Candidate</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            {[
              ['full_name', 'Full Name'],
              ['email', 'Email'],
              ['phone', 'Phone'],
              ['preferred_subject', 'Preferred Subject'],
              ['years_experience', 'Years of Experience'],
              ['highest_qualification', 'Highest Qualification'],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  required={field === 'full_name' || field === 'email'}
                />
              </div>
            ))}
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-gray-300 px-4 py-2 rounded text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Subject</th>
              <th className="p-4 font-medium">Experience</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate(`/candidates/${c.id}`)}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                <td className="p-4 text-gray-900 font-medium">{c.full_name}</td>
                <td className="p-4 text-gray-500">{c.email}</td>
                <td className="p-4 text-gray-500">{c.preferred_subject || '—'}</td>
                <td className="p-4 text-gray-500">{c.years_experience ? `${c.years_experience} yrs` : '—'}</td>
                <td className="p-4"><StatusBadge status={c.current_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}