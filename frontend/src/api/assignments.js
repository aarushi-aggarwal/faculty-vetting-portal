import api from './axios'

export const getAssignments = () =>
  api.get('/assignments')

export const getMyAssignments = () =>
  api.get('/assignments/my')

export const createAssignment = (data) =>
  api.post('/assignments', data)

export const reassign = (id, data) =>
  api.patch(`/assignments/${id}/reassign`, data)

export const markOpened = (id) =>
  api.patch(`/assignments/${id}/open`)