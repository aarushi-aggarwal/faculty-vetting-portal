import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Candidates from './pages/Candidates'
import CandidateDetail from './pages/CandidateDetail'
import Assignments from './pages/Assignments'
import Reviews from './pages/Reviews'
import Interviews from './pages/Interviews'

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/candidates" element={
            <ProtectedRoute>
              <Layout><Candidates /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/candidates/:id" element={
            <ProtectedRoute>
              <Layout><CandidateDetail /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/assignments" element={
            <ProtectedRoute roles={['master_admin', 'admin_l2']}>
              <Layout><Assignments /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/reviews" element={
            <ProtectedRoute>
              <Layout><Reviews /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/interviews" element={
            <ProtectedRoute roles={['master_admin', 'admin_l2']}>
              <Layout><Interviews /></Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}