import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>
  if (!user) return <Navigate to="/login" />
  if (roles && !user.roles?.some((r) => roles.includes(r.name))) {
    return <div className="p-8 text-red-500">Access denied.</div>
  }
  return children
}