// src/stores/useUI.ts
import { create } from 'zustand';

interface Toast {
  id: string; // Unique identifier for the toast
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface UIStore {
  theme: 'light' | 'dark';
  isSidebarOpen: boolean;
  modals: { [key: string]: boolean }; // Modal states keyed by modal ID
  toasts: Toast[];
  isLoading: { [key: string]: boolean }; // Loading states keyed by action

  // Theme Actions
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // Sidebar Actions
  toggleSidebar: () => void;
  setSidebar: (isOpen: boolean) => void;

  // Modal Actions
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;

  // Toast Actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (toastId: string) => void;

  // Loading Actions
  setLoading: (action: string, isLoading: boolean) => void;
}

export const useUI = create<UIStore>((set, get) => ({
  theme: 'light',
  isSidebarOpen: false,
  modals: {},
  toasts: [],
  isLoading: {},

  // Theme Actions
  toggleTheme: () => {
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    }));
  },
  setTheme: (theme) => {
    set({ theme });
  },

  // Sidebar Actions
  toggleSidebar: () => {
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    }));
  },
  setSidebar: (isOpen) => {
    set({ isSidebarOpen: isOpen });
  },

  // Modal Actions
  openModal: (modalId) => {
    set((state) => ({
      modals: { ...state.modals, [modalId]: true },
    }));
  },
  closeModal: (modalId) => {
    set((state) => ({
      modals: { ...state.modals, [modalId]: false },
    }));
  },

  // Toast Actions
  addToast: (toast) => {
    const id = `(${Date.now().toString()}-${Math.random().toString()})`;
    set((state) => ({
      toasts: [...state.toasts, { id, ...toast }],
    }));
  },
  removeToast: (toastId) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== toastId),
    }));
  },

  // Loading Actions
  setLoading: (action, isLoading) => {
    set((state) => ({
      isLoading: { ...state.isLoading, [action]: isLoading },
    }));
  },
}));
