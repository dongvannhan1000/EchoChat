import React, { createContext, useEffect, useState} from 'react'
import { User } from '@/types/chat'
import api from '@/utils/axios'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>;
  isAuthenticated: () => boolean;
  updateUser: (userData: Partial<User>) => void
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/api/me');
      const { user: userData } = response.data;

      if (!userData) {
        throw new Error('No user data received');
      }
      
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing token:', error);
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUser(); // Attempt to fetch user on app load if a token is available
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/login', { email, password });
      const data = response.data;
      
      saveToken(data.token);
      setUser(data.user);
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/api/register', { name, email, password });
      const data = response.data;
      
      if (data.token) {
        saveToken(data.token);
      }
      setUser(data.user);
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  };

  const logout = async(): Promise<void> => {
    try {
      await api.post('/api/logout');
      setUser(null);
      removeToken();
    } catch (error) {
      console.error('Error logging out:', error);
      // Still remove user and token on error
      setUser(null);
      removeToken();
    }
  };

  const refreshToken = async () => {
    const token = getStoredToken();
    if (!token) return;

    try {
      const response = await api.post('/api/refresh-token', { token });
      const data = response.data;
      
      saveToken(data.token);
      setUser(data.user);
      return data.token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      removeToken();
      setUser(null);
      throw error;
    }
  };

  const isAuthenticated = () => {
    const token = getStoredToken();
    return !!token; // Chỉ kiểm tra token, không kiểm tra user
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshToken, isAuthenticated, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}