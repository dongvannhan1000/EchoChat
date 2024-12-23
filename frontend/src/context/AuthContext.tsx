import React, { createContext, useEffect, useState} from 'react'
import { User } from '@/types/chat'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>;
  isAuthenticated: () => boolean;
  updateUser: (userData: Partial<User>) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  const getStoredToken = () => localStorage.getItem('token');

  const saveToken = (token: string) => {
    localStorage.setItem('token', token);
  };

  const removeToken = () => {
    localStorage.removeItem('token');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null)
  }

  const fetchUser = async () => {
    const token = getStoredToken();
    if (!token) return;

    try {
      const response = await fetch(`${String(import.meta.env.VITE_BACKEND_URL)}/api/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        saveToken(data.token as string);
        // Assuming the backend includes user data with the refreshed token
        setUser(data.user as User);
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      removeToken();
    }
  };

  useEffect(() => {
    void fetchUser(); // Attempt to fetch user on app load if a token is available
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${String(import.meta.env.VITE_BACKEND_URL)}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        
      });

      if (!response.ok) throw new Error('Login failed');
      const data = await response.json() as { user: User, token: string };
      saveToken(data.token);
      setUser(data.user); // Assuming backend returns `user` object
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
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
      throw error;
    }
  };

  const logout = async(): Promise<void> => {
    await fetch(`${String(import.meta.env.VITE_BACKEND_URL)}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(() => {
        setUser(null);
        localStorage.removeItem('token');
    })
      .catch((error: unknown) => {
        console.error('Error logging out:', error)
      });
  };

  const refreshToken = async () => {
    const token = getStoredToken();
    if (!token) return;

    try {
      const response = await fetch(`${String(import.meta.env.VITE_BACKEND_URL)}/api/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) throw new Error('Token refresh failed');

      const data = await response.json() as { token: string; user: User };
      saveToken(data.token);
      setUser(data.user);
    } catch (error) {
      console.error('Error refreshing token:', error);
      removeToken();
    }
  };

  const isAuthenticated = () => !!getStoredToken();

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshToken, isAuthenticated, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}