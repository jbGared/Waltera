import { Route, Routes, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from './Login'
import Dashboard from './Dashboard'
import Tarificateur from './Tarificateur'
import Conversations from './Conversations'
import ChatContrats from './ChatContrats'
import ChatConventions from './ChatConventions'
import AnalyseFichiers from './AnalyseFichiers'
import Profile from './Profile'
import Admin from './Admin'

function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

export default function Pages() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Redirect root based on auth status */}
      <Route path="/" element={<RootRedirect />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/tarificateur" element={<ProtectedRoute><Tarificateur /></ProtectedRoute>} />
      <Route path="/chat/contrats" element={<ProtectedRoute><ChatContrats /></ProtectedRoute>} />
      <Route path="/chat/conventions" element={<ProtectedRoute><ChatConventions /></ProtectedRoute>} />
      <Route path="/analyse" element={<ProtectedRoute><AnalyseFichiers /></ProtectedRoute>} />
      <Route path="/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
    </Routes>
  )
}
