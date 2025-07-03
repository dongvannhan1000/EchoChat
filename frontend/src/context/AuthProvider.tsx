import React, { useEffect, useState, useCallback } from 'react';
import { User } from '@/types/chat';
import api from '@/utils/axios';
import { AxiosRequestConfig } from "axios";
import { AuthContext } from './AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useUser } from '@/stores/useUser';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setSelectedUser } = useUser();

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return sessionStorage.getItem('accessToken');
  });

  // ====================================================================
  // FIX 1: Tách hàm refreshToken ra ngoài để sử dụng useCallback,
  // tránh việc nó bị tạo lại liên tục và gây ra các re-render không cần thiết.
  // ====================================================================
  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await api.post('/api/refresh-token');
      const data = response.data;
      
      const newToken = data.accessToken as string;
      sessionStorage.setItem('accessToken', newToken);
      setAccessToken(newToken);
      
      if (data.user) {
        setUser(data.user as User);
      }

      // Re-initialize socket with the new token
      if (useWebSocket.getState().socket) {
        await useWebSocket.getState().disconnect();
        await useWebSocket.getState().initializeSocket(newToken);
      }
      return newToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Đăng xuất người dùng nếu không thể làm mới token
      sessionStorage.removeItem('accessToken');
      setAccessToken(null);
      setUser(null);
      if (useWebSocket.getState().isConnected) {
        void useWebSocket.getState().disconnect();
      }
      return null;
    }
  }, []); // useCallback với dependency rỗng

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      config => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newToken = await refreshToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return await api(originalRequest as AxiosRequestConfig);
            }
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, refreshToken]); // Thêm refreshToken vào dependency

  // ====================================================================
  // FIX 2: Thay đổi logic fetchUser và useEffect gọi nó.
  // useEffect này sẽ chạy mỗi khi accessToken thay đổi.
  // ====================================================================
  useEffect(() => {
    const fetchUserOnTokenChange = async () => {
      // Chỉ fetch user nếu có token và chưa có thông tin user
      if (accessToken && !user) {
        setLoading(true);
        try {
          const response = await api.get('/api/me');
          const { user: userData } = response.data;

          if (!userData) {
            throw new Error('No user data received');
          }
          
          setUser(userData as User);
          setSelectedUser(userData as User);

        } catch (error) {
          // Lỗi ở đây có nghĩa là token không hợp lệ và interceptor đã không thể sửa lỗi.
          // Không cần gọi refreshToken() ở đây nữa để tránh vòng lặp.
          console.error('Could not fetch user with the provided token:', error);
          // Interceptor hoặc hàm refreshToken đã xử lý việc logout rồi.
        } finally {
          setLoading(false);
        }
      } else if (!accessToken) {
        // Nếu không có token, đảm bảo đã logout và dừng loading.
        setUser(null);
        setLoading(false);
      }
    };

    void fetchUserOnTokenChange();
  }, [accessToken, user, setSelectedUser]); // Phụ thuộc vào accessToken

  useEffect(() => {
    const initSocketWithToken = async () => {
      if (accessToken && !useWebSocket.getState().isInitialized) {
        await useWebSocket.getState().initializeSocket(accessToken);
      }
    };
    
    void initSocketWithToken();
    
    // Cleanup socket connection when logging out
    return () => {
      if (!accessToken && useWebSocket.getState().isConnected) {
        void useWebSocket.getState().disconnect();
      }
    };
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    const response = await api.post('/api/login', { email, password });
    const data = response.data;
    const newAccessToken = data.accessToken as string;
    
    sessionStorage.setItem('accessToken', newAccessToken);
    // Chỉ cần setAccessToken, useEffect ở trên sẽ tự động fetch user
    setAccessToken(newAccessToken);
  };

  const loginWithToken = async (token: string) => {
    sessionStorage.setItem('accessToken', token);
    // Chỉ cần setAccessToken, useEffect ở trên sẽ tự động fetch user
    setAccessToken(token);
  };

  const register = async (name: string, email: string, password: string) => {
    await api.post('/api/register', { name, email, password });
  };

  const logout = async(): Promise<void> => {
    try {
      await api.post('/api/logout');
    } catch (error) {
      console.error('Error during server logout, proceeding with client-side logout:', error);
    } finally {
      // Luôn thực hiện logout ở client-side
      sessionStorage.removeItem('accessToken');
      setAccessToken(null);
      setUser(null);
      if (useWebSocket.getState().isConnected) {
        await useWebSocket.getState().disconnect();
      }
    }
  };

  const isAuthenticated = () => {
    return !!accessToken;
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithToken, register, logout, refreshToken, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
