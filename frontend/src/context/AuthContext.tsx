import { createContext } from 'react'
import { User } from '@/types/chat'


interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  loginWithToken: (token: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<string | null>;
  isAuthenticated: () => boolean;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

