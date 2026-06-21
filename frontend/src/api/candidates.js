import api from './axios'

export const getCandidates = (status) =>
  api.get('/candidates', { params: status ? { status } : {} })

export const getCandidate = (id) =>
  api.get(`/candidates/${id}`)

export const createCandidate = (data) =>
  api.post('/candidates', data)

export const updateStatus = (id, status, reason) =>
  api.patch(`/candidates/${id}/status`, { status, reason })

export const uploadCV = (candidateId, file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/candidates/${candidateId}/upload-cv`, form)
}

export const getReviewSummary = (candidateId) =>
  api.get(`/reviews/candidate/${candidateId}/summary`)