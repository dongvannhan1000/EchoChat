import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { useAuth } from './hooks/useAuth'
import AppLayout from './components/AppLayout'
import { OAuthCallback } from './pages/OAuthCallback'

// Lazy load các pages
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(module => ({ default: module.RegisterPage })))
const ChatPage = lazy(() => import('./pages/ChatPage').then(module => ({ default: module.ChatPage })))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
)

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated()) {
    // Store the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (isAuthenticated()) {
    // Redirect to the stored location or default to /chat
    return <Navigate to={location.state?.from?.pathname || '/chat'} replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />
            <Route path="/auth/callback" element={
              <PublicRoute>
                <OAuthCallback />
              </PublicRoute>
            } />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/chat" replace />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;