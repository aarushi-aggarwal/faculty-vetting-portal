import api from './axios'

export const getInterviews = () =>
  api.get('/interviews')

export const getMyInterviews = () =>
  api.get('/interviews/my')

export const scheduleInterview = (data) =>
  api.post('/interviews', data)

export const rescheduleInterview = (id, data) =>
  api.patch(`/interviews/${id}/reschedule`, data)

export const completeInterview = (id) =>
  api.patch(`/interviews/${id}/complete`)

export const submitFeedback = (id, data) =>
  api.post(`/interviews/${id}/feedback`, data)

export const finalizeFeedback = (id) =>
  api.post(`/interviews/${id}/feedback/submit`)

export const getFeedbackSummary = (id) =>
  api.get(`/interviews/${id}/feedback/summary`)