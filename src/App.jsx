import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AppShell from '@/components/layout/AppShell'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import DashboardPage from '@/pages/DashboardPage'
import ResumeBuilderPage from '@/pages/ResumeBuilderPage'
import ResumeAnalyzerPage from '@/pages/ResumeAnalyzerPage'
import InterviewPage from '@/pages/InterviewPage'
import CareerGuidancePage from '@/pages/CareerGuidancePage'
import ProfilePage from '@/pages/ProfilePage'

import { Toaster } from 'sonner'

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" theme="dark" />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/resume-builder" element={<ResumeBuilderPage />} />
            <Route path="/resume-analyzer" element={<ResumeAnalyzerPage />} />
            <Route path="/interview" element={<InterviewPage />} />
            <Route path="/career-guidance" element={<CareerGuidancePage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
