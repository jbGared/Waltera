import { Route, Routes, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminRoute from '@/components/AdminRoute'

// Lazy load pages for code splitting
const Login = lazy(() => import('./Login'))
const ForgotPassword = lazy(() => import('./ForgotPassword'))
const ResetPassword = lazy(() => import('./ResetPassword'))
const MFAVerification = lazy(() => import('./MFAVerification'))
const Dashboard = lazy(() => import('./Dashboard'))
const Tarificateur = lazy(() => import('./Tarificateur'))
const Conversations = lazy(() => import('./Conversations'))
const ChatContrats = lazy(() => import('./ChatContrats'))
const ChatConventions = lazy(() => import('./ChatConventions'))
const AnalyseFichiers = lazy(() => import('./AnalyseFichiers'))
const Profile = lazy(() => import('./Profile'))
const Admin = lazy(() => import('./Admin'))
const CCN = lazy(() => import('./CCN'))
const CcnManagement = lazy(() => import('./CcnManagement'))
const CcnMonitoring = lazy(() => import('./CcnMonitoring'))
const Mapping = lazy(() => import('./Mapping'))
const NasSync = lazy(() => import('./NasSync'))
const TechnicalDocumentation = lazy(() => import('./admin/TechnicalDocumentation'))
const AdminDocumentation = lazy(() => import('./admin/AdminDocumentation'))
const Documentation = lazy(() => import('./Documentation'))

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
        <Route path="/mfa" element={<MFAVerification />} />
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
        <Route path="/ccn/gestion" element={<ProtectedRoute><CcnManagement /></ProtectedRoute>} />
        <Route path="/ccn/monitoring" element={<ProtectedRoute><CcnMonitoring /></ProtectedRoute>} />
        <Route path="/mapping" element={<ProtectedRoute><Mapping /></ProtectedRoute>} />
        <Route path="/nas-sync" element={<ProtectedRoute><NasSync /></ProtectedRoute>} />
        <Route path="/documentation" element={<ProtectedRoute><Documentation /></ProtectedRoute>} />

        {/* Admin-only routes */}
        <Route path="/admin/docs" element={<AdminRoute><AdminDocumentation /></AdminRoute>} />
        <Route path="/admin/documentation" element={<AdminRoute><TechnicalDocumentation /></AdminRoute>} />
      </Routes>
    </Suspense>
  )
}
