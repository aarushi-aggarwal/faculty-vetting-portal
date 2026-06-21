import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = user?.roles?.some((r) =>
    ['master_admin', 'admin_l2'].includes(r.name)
  )

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-gray-900">Faculty Vetting Portal</span>
        <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
        <Link to="/candidates" className="text-sm text-gray-600 hover:text-gray-900">Candidates</Link>
        {isAdmin && (
          <>
            <Link to="/assignments" className="text-sm text-gray-600 hover:text-gray-900">Assignments</Link>
            <Link to="/interviews" className="text-sm text-gray-600 hover:text-gray-900">Interviews</Link>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{user?.full_name}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-700"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}