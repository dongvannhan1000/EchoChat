import { createContext } from 'react'
import { User } from '@/types/chat'


interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<string | null>;
  isAuthenticated: () => boolean;
  updateUser: (userData: Partial<User>) => void
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

