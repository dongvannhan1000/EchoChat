import { create } from 'zustand';
import { UserChat, Chat, ChatType } from '../types/chat';
import api from '../utils/axios';
import { useWebSocket } from '../hooks/useWebSocket';

interface ChatStore {
  chats: UserChat[];
  currentChat: Chat | null;
  isLoading: { [key: string]: boolean };
  error: { [key: string]: string | null };

  fetchUserChats: () => Promise<void>;
  fetchChatDetails: (chatId: number) => Promise<void>;
  createChat: (userIds: number[], chatType?: ChatType) => Promise<void>;
  leaveChat: (chatId: number) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  currentChat: null,
  isLoading: {},
  error: {},

  fetchUserChats: async () => {
    const action = 'fetchUserChats';
    try {
      set((state) => ({
        isLoading: { ...state.isLoading, [action]: true },
        error: { ...state.error, [action]: null },
      }));

      const response = await api.get(`/api/chats`);
      set({ chats: response.data });
    } catch (error) {
      set((state) => ({
        error: { ...state.error, [action]: 'Failed to fetch chats' },
      }));
    } finally {
      set((state) => ({
        isLoading: { ...state.isLoading, [action]: false },
      }));
    }
  },

   // Fetch chat details
  fetchChatDetails: async (chatId: number) => {
    const action = 'fetchChatDetails';
    try {
      set({
        isLoading: { ...get().isLoading, [action]: true },
        error: { ...get().error, [action]: null },
      });

      const response = await api.get(`/api/chats/${chatId.toString()}`);
      set({
        currentChat: response.data,
        isLoading: { ...get().isLoading, [action]: false }
      });

      useWebSocket.getState().joinRoom(chatId);
    } catch (error) {
      set((state) => ({
        error: { ...state.error, [action]: 'Failed to fetch chat details' },
      }));
    } finally {
      set((state) => ({
        isLoading: { ...state.isLoading, [action]: false },
      }));
    }
  },

  createChat: async (userIds: number[]) => {
    const action = 'createChat';
    try {
      set((state) => ({
        isLoading: { ...state.isLoading, [action]: true },
        error: { ...state.error, [action]: null },
      }));

      const response = await api.post('/api/chats', { 
        chatType: 'private', 
        participantIds: userIds 
      });
      set((state) => ({
        chats: [...state.chats, response.data],
      }));
    } catch (error) {
      set((state) => ({
        error: { ...state.error, [action]: 'Failed to create chat' },
      }));
    } finally {
      set((state) => ({
        isLoading: { ...state.isLoading, [action]: false },
      }));
    }
  },

  // Leave a chat
  leaveChat: async (chatId: number) => {
    const action = 'leaveChat';
    try {
      await api.delete(`/api/chats/${chatId.toString()}/leave`);
      set((state) => {
        const updatedChats = state.chats.filter((chat) => chat.chatId !== chatId);
        
        return {
          chats: updatedChats,
          currentChat: null, // Always set to null when leaving a chat
        };
      });

      useWebSocket.getState().leaveRoom(chatId);
    } catch (error) {
      set((state) => ({
        error: { ...state.error, [action]: 'Failed to leave chat' },
      }));
    }
  },
}))