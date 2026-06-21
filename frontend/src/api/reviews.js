import api from './axios'

export const createReview = (data) =>
  api.post('/reviews', data)

export const submitReview = (id) =>
  api.post(`/reviews/${id}/submit`)

export const getReviewsForAssignment = (assignmentId) =>
  api.get(`/reviews/assignment/${assignmentId}`)

export const addComment = (data) =>
  api.post('/reviews/comments', data)

export const getComments = (candidateId) =>
  api.get(`/reviews/comments/${candidateId}`)