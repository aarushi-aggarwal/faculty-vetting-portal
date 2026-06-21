const colors = {
  UPLOADED: 'bg-gray-100 text-gray-700',
  PENDING_ASSIGNMENT: 'bg-yellow-100 text-yellow-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-purple-100 text-purple-700',
  SHORTLISTED: 'bg-green-100 text-green-700',
  INTERVIEW_SCHEDULED: 'bg-indigo-100 text-indigo-700',
  INTERVIEW_DONE: 'bg-teal-100 text-teal-700',
  OFFER_PENDING: 'bg-orange-100 text-orange-700',
  ACCEPTED: 'bg-green-200 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  ON_HOLD: 'bg-gray-200 text-gray-600',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}