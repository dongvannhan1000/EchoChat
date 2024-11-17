

// src/stores/useChat.ts
/* eslint-disable @typescript-eslint/no-unused-vars */


import { create } from 'zustand';
import { Chat, Message, UserChat } from '../types/chat';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../utils/axios'


interface ChatStore {
  chats: UserChat[];
  currentChat: Chat | null;
  messages: Message[];
  isLoading: { [key: string]: boolean }; // Action-specific loading states
  error: { [key: string]: string | null }; // Action-specific error states
  hasMoreMessages: boolean; // For pagination
  messagePage: number; // Current page for message pagination
  
  // Actions
  fetchUserChats: () => Promise<void>;
  fetchChatDetails: (chatId: number) => Promise<void>;
  fetchMessages: (chatId: number) => Promise<void>;
  sendMessage: (chatId: number, content: string, image?: string) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  createChat: (userIds: number[]) => Promise<void>;
  leaveChat: (chatId: number) => Promise<void>;
  setCurrentChat: (chat: Chat | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: number) => void;
}

export const useChat = create<ChatStore>((set, get) => ({

  
  chats: [],
  currentChat: null,
  messages: [],
  isLoading: {},
  error: {},
  hasMoreMessages: true,
  messagePage: 1,

  // Fetch all user chats

  fetchUserChats: async () => {
    const action = 'fetchUserChats';
    try {
      set((state) => ({
        isLoading: { ...state.isLoading, [action]: true },
        error: { ...state.error, [action]: null },
      }));

      const response = await api.get(`/api/user-chats`);
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
      set((state) => ({
        isLoading: { ...state.isLoading, [action]: true },
        error: { ...state.error, [action]: null },
      }));

      const response = await api.get(`/api/chats/${chatId.toString()}`);
      set({ currentChat: response.data });
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

  // Fetch paginated messages
  fetchMessages: async (chatId: number, reset = false) => {
    const action = 'fetchMessages';
    try {
      const { messagePage, hasMoreMessages, messages } = get();
      if (!hasMoreMessages && !reset) return;

      set((state) => ({
        isLoading: { ...state.isLoading, [action]: true },
        error: { ...state.error, [action]: null },
      }));

      const page = reset ? 1 : messagePage;
      const response = await api.get(`/api/chats/${chatId.toString()}/messages?page=${page.toString()}`);

      set((state) => ({
        messages: reset ? response.data : [...state.messages, ...response.data],
        messagePage: page + 1,
        hasMoreMessages: response.data.length > 0,
      }));
    } catch (error) {
      set((state) => ({
        error: { ...state.error, [action]: 'Failed to fetch messages' },
      }));
    } finally {
      set((state) => ({
        isLoading: { ...state.isLoading, [action]: false },
      }));
    }
  },

  // Send a new message
  sendMessage: async (chatId: number, content: string, image?: string) => {
    const action = 'sendMessage';
    try {
      set((state) => ({
        isLoading: { ...state.isLoading, [action]: true },
        error: { ...state.error, [action]: null },
      }));

      const response = await api.post(`/api/chats/${chatId.toString()}/messages`, {
        content,
        image,
      });

      const newMessage = response.data as Message;
      set((state) => ({
        messages: [...state.messages, newMessage],
      }));

      useWebSocket.getState().sendMessage(newMessage);
    } catch (error) {
      set((state) => ({
        error: { ...state.error, [action]: 'Failed to send message' },
      }));
    } finally {
      set((state) => ({
        isLoading: { ...state.isLoading, [action]: false },
      }));
    }
  },
  
  // Delete a message
  deleteMessage: async (messageId: number) => {
    const action = 'deleteMessage';
    try {
      await api.delete(`/api/messages/${messageId.toString()}`);
      set((state) => ({
        messages: state.messages.filter((msg) => msg.id !== messageId),
      }));
    } catch (error) {
      set((state) => ({
        error: { ...state.error, [action]: 'Failed to delete message' },
      }));
    }
  },

  // Create a new chat
  createChat: async (userIds: number[]) => {
    const action = 'createChat';
    try {
      set((state) => ({
        isLoading: { ...state.isLoading, [action]: true },
        error: { ...state.error, [action]: null },
      }));

      const response = await api.post('/api/chats', { userIds });
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
      set((state) => ({
        chats: state.chats.filter((chat) => chat.chatId !== chatId),
        currentChat: null,
      }));

      useWebSocket.getState().leaveRoom(chatId);
    } catch (error) {
      set((state) => ({
        error: { ...state.error, [action]: 'Failed to leave chat' },
      }));
    }
  },

  // Set the current chat
  setCurrentChat: (chat: Chat | null) => {
    set({ currentChat: chat });
  },

  // Add a new message
  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  // Update an existing message
  updateMessage: (message: Message) => {
    set((state) => ({
      messages: state.messages.map((msg) => (msg.id === message.id ? message : msg)),
    }));
  },

  // Remove a message
  removeMessage: (messageId: number) => {
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    }));
  },
}));
