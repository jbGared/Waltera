import { Route, Routes, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

// Lazy load pages for code splitting
const Login = lazy(() => import('./Login'))
const ForgotPassword = lazy(() => import('./ForgotPassword'))
const ResetPassword = lazy(() => import('./ResetPassword'))
const Dashboard = lazy(() => import('./Dashboard'))
const Tarificateur = lazy(() => import('./Tarificateur'))
const Conversations = lazy(() => import('./Conversations'))
const ChatContrats = lazy(() => import('./ChatContrats'))
const ChatConventions = lazy(() => import('./ChatConventions'))
const AnalyseFichiers = lazy(() => import('./AnalyseFichiers'))
const Profile = lazy(() => import('./Profile'))
const Admin = lazy(() => import('./Admin'))
const CCN = lazy(() => import('./CCN'))
const Mapping = lazy(() => import('./Mapping'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}

function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

export default function Pages() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

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
        <Route path="/ccn" element={<ProtectedRoute><CCN /></ProtectedRoute>} />
        <Route path="/mapping" element={<ProtectedRoute><Mapping /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  )
}
