import React from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ChatPage } from './pages/ChatPage'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // const { user } = useAuth() 
  const user = {
    id: 'user1',
    name: 'John Doe',
    avatar: '/placeholder.svg?height=40&width=40'
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App