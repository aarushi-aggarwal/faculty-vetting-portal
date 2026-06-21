import { useEffect, useState } from 'react'
import { getInterviews, scheduleInterview, completeInterview } from '../api/interviews'

export default function Interviews() {
  const [interviews, setInterviews] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ candidate_id: '', start_time: '', end_time: '', meeting_link: '', meeting_platform: 'google_meet', notes: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInterviews().then((r) => setInterviews(r.data)).finally(() => setLoading(false))
  }, [])

  const handleSchedule = async (e) => {
    e.preventDefault()
    await scheduleInterview(form)
    const r = await getInterviews()
    setInterviews(r.data)
    setShowForm(false)
  }

  const handleComplete = async (id) => {
    await completeInterview(id)
    const r = await getInterviews()
    setInterviews(r.data)
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Interviews</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
          Schedule Interview
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">New Interview</h2>
          <form onSubmit={handleSchedule} className="grid grid-cols-2 gap-4">
            {[
              ['candidate_id', 'Candidate ID', 'text'],
              ['start_time', 'Start Time', 'datetime-local'],
              ['end_time', 'End Time', 'datetime-local'],
              ['meeting_link', 'Meeting Link', 'text'],
            ].map(([field, label, type]) => (
              <div key={field}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  type={type}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Platform</label>
              <select value={form.meeting_platform} onChange={(e) => setForm({ ...form, meeting_platform: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="google_meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="teams">Teams</option>
                <option value="in_person">In Person</option>
              </select>
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm">Schedule</button>
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
              <th className="p-4 font-medium">Round</th>
              <th className="p-4 font-medium">Start Time</th>
              <th className="p-4 font-medium">Platform</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map((i) => (
              <tr key={i.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 text-gray-900">{i.candidate_id}</td>
                <td className="p-4 text-gray-500">Round {i.round_number}</td>
                <td className="p-4 text-gray-500">{new Date(i.start_time).toLocaleString()}</td>
                <td className="p-4 text-gray-500 capitalize">{i.meeting_platform?.replace('_', ' ')}</td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">{i.status}</span>
                </td>
                <td className="p-4">
                  {i.status !== 'completed' && (
                    <button onClick={() => handleComplete(i.id)} className="text-xs text-blue-600 hover:underline">Mark Complete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}