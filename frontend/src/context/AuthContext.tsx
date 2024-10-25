import React, { createContext, useState} from 'react'
import { User } from '@/types/user'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${String(import.meta.env.VITE_BACKEND_URL)}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        
      });

      if (!response.ok) throw new Error('Login failed');
      const user = await response.json() as { user: User };
      setUser(user); // Assuming backend returns `user` object
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(`${String(import.meta.env.VITE_BACKEND_URL)}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!response.ok) throw new Error('Registration failed');
      const data = await response.json() as { user: User};
      setUser(data.user);
    } catch (error) {
      console.error('Error registering:', error);
    }
  };

  const logout = async(): Promise<void> => {
    await fetch(`${String(import.meta.env.VITE_BACKEND_URL)}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(() => {
        setUser(null)
    })
      .catch((error: unknown) => {
        console.error('Error logging out:', error)
      });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}