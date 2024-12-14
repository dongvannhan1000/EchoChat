import { create } from 'zustand';
import api from '../utils/axios';
import { useChatStore } from './useChatV2';

interface UserChatInteractions {
  isLoading: { [key: string]: boolean };
  error: { [key: string]: string | null };

  markChatStatus: (id: number, forceMarkAsSeen?: boolean) => Promise<void>;
  pinChat: (id: number) => Promise<void>;
  muteChat: (chatId: number, mutedUntil: Date) => Promise<void>;
  blockUser: (userId: number) => Promise<void>;
  unblockUser: (userId: number) => Promise<void>;
}

export const useUserChatInteractionsStore = create<UserChatInteractions>((set, get) => ({
  isLoading: {},
  error: {},

  markChatStatus: async (id: number, forceMarkAsSeen?: boolean) => {
    const action = 'markMessageAsRead';
    try {
      console.log('Sending API request', id, forceMarkAsSeen);
      const response = await api.put(`/api/chats/${id.toString()}/toggle-read`, {
        forceMarkAsSeen 
      });
      console.log('API Response:', response);
      
      // Update the chats in the chatStore
      useChatStore.setState(state => {
        const updatedChats = state.chats.map(chat => {
          if (chat.id === id) {
            const newSeenStatus = forceMarkAsSeen !== undefined 
              ? forceMarkAsSeen 
              : !chat.isSeen;
            
            return { ...chat, isSeen: newSeenStatus };
          }
          return chat;
        });
        
        return { chats: updatedChats };
      });
    } catch (error) {
      console.error('API Error:', error);
      set(state => ({
        error: { ...state.error, [action]: 'Failed to mark as read' },
      }));
    }
  },

  pinChat: async (id: number) => {
    const action = 'pinChat';
    try {
      console.log('Sending API request to pin chat', id);
      const response = await api.put(`/api/chats/${id.toString()}/pin`);
      console.log('API Response:', response);
      
      // Update the chats in the chatStore
      useChatStore.setState(state => {
        const updatedChats = state.chats.map(chat => {
          if (chat.id === id) {
            return { ...chat, pinned: !chat.pinned };
          }
          return chat;
        });
        
        return { chats: updatedChats };
      });
    } catch (error) {
      console.error('API Error:', error);
      set(state => ({
        error: { ...state.error, [action]: 'Failed to pin chat' },
      }));
    }
  },

  muteChat: async (chatId: number, mutedUntil: Date) => {
    const action = 'muteChat';
    try {
      await api.put(`/api/user-chats/${chatId.toString()}/mute`, { mutedUntil });
      
      // Update the chats in the chatStore
      const chatStore = useChatStore.getState();
      const updatedChats = chatStore.chats.map(chat =>
        chat.chatId === chatId ? { ...chat, mutedUntil } : chat
      );
      chatStore.chats = updatedChats;
    } catch (error) {
      console.error('API Error:', error);
      set(state => ({
        error: { ...state.error, [action]: 'Failed to mute chat' },
      }));
    }
  },

  blockUser: async (userId: number) => {
    const action = 'blockUser';
    try {
      await api.post(`/api/users/block`, { userId });
      // Update local state if needed
    } catch (error) {
      console.error('API Error:', error);
      set(state => ({
        error: { ...state.error, [action]: 'Failed to block user' },
      }));
    }
  },

  unblockUser: async (userId: number) => {
    const action = 'unblockUser';
    try {
      set(state => ({
        isLoading: { ...state.isLoading, [action]: true },
        error: { ...state.error, [action]: null },
      }));

      await api.post(`/api/users/unblock`, { userId });
      
      // Update local state if needed
      // You might want to refresh user data or chat list after unblocking
      await useChatStore.getState().fetchUserChats();
      
    } catch (error) {
      console.error('API Error:', error);
      set(state => ({
        error: { ...state.error, [action]: 'Failed to unblock user' },
      }));
    } finally {
      set(state => ({
        isLoading: { ...state.isLoading, [action]: false },
      }));
    }
  },
}));