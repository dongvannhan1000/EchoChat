import React, { createContext, useState, useContext } from 'react'
import { User } from '@/types/user'

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => void
  register: (username: string, email: string, password: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  const login = (username: string, password: string) => {
    // In a real app, you'd validate credentials against a backend
    console.log(`Logging in with username: ${username} and password: ${password}`);
    setUser({ id: 'user1', name: username, avatar: '/placeholder.svg?height=40&width=40' })
  }

  const register = (username: string, email: string, password: string) => {
    // In a real app, you'd send this information to a backend to create a new user
    console.log(`Registering with username: ${username}, email: ${email}, and password: ${password}`);
    setUser({ id: 'user1', name: username, avatar: '/placeholder.svg?height=40&width=40' })
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}