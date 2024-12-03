// src/stores/useUser.ts
/* eslint-disable @typescript-eslint/no-unused-vars */

import { create } from 'zustand';
import api from '../utils/axios'
import { User } from '../types/chat';

interface UserStore {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUsers: (searchTerm: string) => Promise<void>;
  fetchUser: (userId: number) => Promise<void>;
  updateUser: (userId: number, data: Partial<User>) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
}

export const useUser = create<UserStore>((set) => ({
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,

  fetchUsers: async (searchTerm) => {
    try {
      set({ isLoading: true });
      const response = await api.get('/api/users', { params: { search: searchTerm || '' } });
      console.log('API Response:', response.data);
      set({ users: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch users', isLoading: false });
    }
  },

  fetchUser: async (userId: number) => {
    try {
      set({ isLoading: true });
      const response = await api.get(`/api/users/${userId.toString()}`);
      set({ selectedUser: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch user', isLoading: false });
    }
  },

  updateUser: async (userId: number, data: Partial<User>) => {
    try {
      set({ isLoading: true });
      const response = await api.put(`/api/users/${userId.toString()}`, data);
      set((state) => ({
        users: state.users.map((user) =>
          user.id === userId ? { ...user, ...response.data } : user
        ),
        selectedUser: response.data,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update user', isLoading: false });
    }
  },

  setSelectedUser: (user: User | null) => {
    set({ selectedUser: user });
  },
}));