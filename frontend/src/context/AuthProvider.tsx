import React, { useEffect, useState} from 'react'
import { User } from '@/types/chat'
import api from '@/utils/axios'
import { AxiosRequestConfig } from "axios";
import { AuthContext } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return sessionStorage.getItem('accessToken');
  });

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null)
  }

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      config => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      error => Promise.reject(error instanceof Error ? error : new Error(String(error)))
    );

    const responseInterceptor = api.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newToken = await refreshToken() as string;
            
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return await api(originalRequest as AxiosRequestConfig);
            }
          } catch (refreshError) {
            setUser(null);
            setAccessToken(null);
            sessionStorage.removeItem('accessToken');
            return Promise.reject(refreshError instanceof Error ? refreshError : new Error(String(refreshError)))
          }
        }
        
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    );

    // Cleanup function
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken]);

  const fetchUser = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/api/me');
      const { user: userData } = response.data;

      if (!userData) {
        throw new Error('No user data received');
      }
      
      setUser(userData as User);
    } catch (error) {
      console.error('Error refreshing token:', error);
      await refreshToken();
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

      const accessToken = data.accessToken as string;
      
      sessionStorage.setItem('accessToken', accessToken);
      setAccessToken(accessToken);
      setUser(data.user as User);
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      await api.post('/api/register', { name, email, password });
      
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  };

  const logout = async(): Promise<void> => {
    try {
      await api.post('/api/logout');
      sessionStorage.removeItem('accessToken');
      setAccessToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      // Still remove user and token on error
      sessionStorage.removeItem('accessToken');
      setAccessToken(null);
      setUser(null);
    }
  };

  const refreshToken = async (): Promise<string | null> => {

    try {
      const response = await api.post('/api/refresh-token');
      const data = response.data;
      
      sessionStorage.setItem('accessToken', data.accessToken as string);
      setAccessToken(data.accessToken as string);
      if (data.user) {
        setUser(data.user as User);
      }
      return data.accessToken as string;
    } catch (error) {
      console.error('Error refreshing token:', error);
      sessionStorage.removeItem('accessToken');
      setAccessToken(null);
      setUser(null);
      return null;
    }
  };

  const isAuthenticated = () => {
    return !!accessToken;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshToken, isAuthenticated, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}