import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCandidate, updateStatus, uploadCV, getReviewSummary } from '../api/candidates'
import { getMyAssignments, markOpened } from '../api/assignments'
import { createReview, submitReview, getReviewsForAssignment, addComment, getComments } from '../api/reviews'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

const STATUSES = ['UPLOADED','PENDING_ASSIGNMENT','ASSIGNED','UNDER_REVIEW','SHORTLISTED','INTERVIEW_SCHEDULED','INTERVIEW_DONE','OFFER_PENDING','ACCEPTED','REJECTED','ON_HOLD']

export default function CandidateDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [candidate, setCandidate] = useState(null)
  const [summary, setSummary] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [reviews, setReviews] = useState([])
  const [comments, setComments] = useState([])
  const [cvFile, setCvFile] = useState(null)
  const [comment, setComment] = useState('')
  const [review, setReview] = useState({ verdict: '', strengths: '', concerns: '', recommendation: '', overall_score: '' })
  const [reviewId, setReviewId] = useState(null)

  const isTeacher = user?.roles?.some((r) => r.name === 'teacher')
  const isAdmin = user?.roles?.some((r) => ['master_admin', 'admin_l2'].includes(r.name))

  useEffect(() => {
    getCandidate(id).then((r) => setCandidate(r.data))
    getComments(id).then((r) => setComments(r.data))
    if (isAdmin) getReviewSummary(id).then((r) => setSummary(r.data)).catch(() => {})
    if (isTeacher) {
      getMyAssignments().then((r) => {
        const a = r.data.find((a) => a.candidate_id === id)
        if (a) {
          setAssignment(a)
          markOpened(a.id)
          getReviewsForAssignment(a.id).then((rev) => {
            setReviews(rev.data)
            const draft = rev.data.find((r) => !r.is_final)
            if (draft) {
              setReviewId(draft.id)
              setReview({
                verdict: draft.verdict || '',
                strengths: draft.strengths || '',
                concerns: draft.concerns || '',
                recommendation: draft.recommendation || '',
                overall_score: draft.overall_score || ''
              })
            }
          })
        }
      })
    }
  }, [id])

  const handleUploadCV = async () => {
    if (!cvFile) return
    await uploadCV(id, cvFile)
    setCvFile(null)
    alert('CV uploaded successfully')
  }

  const handleStatusChange = async (e) => {
    await updateStatus(id, e.target.value)
    const r = await getCandidate(id)
    setCandidate(r.data)
  }

  const handleSaveReview = async () => {
    const data = { assignment_id: assignment.id, ...review, overall_score: review.overall_score ? Number(review.overall_score) : null }
    const r = await createReview(data)
    setReviewId(r.data.id)
    alert('Review saved as draft')
  }

  const handleSubmitReview = async () => {
    if (!reviewId) await handleSaveReview()
    await submitReview(reviewId)
    alert('Review submitted')
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    await addComment({ candidate_id: id, body: comment })
    const r = await getComments(id)
    setComments(r.data)
    setComment('')
  }

  if (!candidate) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{candidate.full_name}</h1>
          <p className="text-sm text-gray-500">{candidate.email} · {candidate.phone || 'No phone'}</p>
        </div>
        <StatusBadge status={candidate.current_status} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          ['Preferred Subject', candidate.preferred_subject],
          ['Experience', candidate.years_experience ? `${candidate.years_experience} years` : '—'],
          ['Qualification', candidate.highest_qualification],
          ['Employer', candidate.current_employer],
        ].map(([label, value]) => (
          <div key={label} className="bg-white border border-gray-200 rounded p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm text-gray-900 font-medium">{value || '—'}</p>
          </div>
        ))}
      </div>

      {isAdmin && (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Update Status</h2>
            <select
              value={candidate.current_status}
              onChange={handleStatusChange}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Upload CV</h2>
            <div className="flex gap-2">
              <input type="file" accept=".pdf" onChange={(e) => setCvFile(e.target.files[0])} className="text-sm" />
              <button onClick={handleUploadCV} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Upload</button>
            </div>
          </div>

          {summary && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <h2 className="text-sm font-medium text-gray-700 mb-3">Review Summary</h2>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">Shortlist: {summary.verdicts?.shortlist}</span>
                <span className="text-red-500">Reject: {summary.verdicts?.reject}</span>
                <span className="text-yellow-600">Flag: {summary.verdicts?.flag_discussion}</span>
                {summary.average_score && <span className="text-gray-600">Avg Score: {summary.average_score}</span>}
              </div>
            </div>
          )}
        </>
      )}

      {isTeacher && assignment && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Your Review</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Verdict</label>
              <select
                value={review.verdict}
                onChange={(e) => setReview({ ...review, verdict: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
              >
                <option value="">Select verdict</option>
                <option value="shortlist">Shortlist</option>
                <option value="reject">Reject</option>
                <option value="flag_discussion">Flag for Discussion</option>
              </select>
            </div>
            {['strengths', 'concerns', 'recommendation'].map((field) => (
              <div key={field}>
                <label className="block text-xs text-gray-500 mb-1 capitalize">{field}</label>
                <textarea
                  value={review[field]}
                  onChange={(e) => setReview({ ...review, [field]: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Overall Score (0-5)</label>
              <input
                type="number" min="0" max="5" step="0.5"
                value={review.overall_score}
                onChange={(e) => setReview({ ...review, overall_score: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-24"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveReview} className="border border-gray-300 px-4 py-2 rounded text-sm">Save Draft</button>
              <button onClick={handleSubmitReview} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Submit Review</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Comments</h2>
        <div className="space-y-3 mb-4">
          {comments.map((c) => (
            <div key={c.id} className="text-sm bg-gray-50 rounded p-3">
              <p className="text-gray-900">{c.body}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
            required
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Post</button>
        </form>
      </div>
    </div>
  )
}