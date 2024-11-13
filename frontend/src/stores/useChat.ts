

// src/stores/useChat.ts
/* eslint-disable @typescript-eslint/no-unused-vars */


import { create } from 'zustand';
import axios from 'axios';
import { Chat, Message, UserChat } from '../types/chat';
import { useWebSocket } from '../hooks/useWebSocket';

interface ChatStore {
  chats: UserChat[];
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
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
  isLoading: false,
  error: null,

  fetchUserChats: async () => {
    try {
      set({ isLoading: true });
      const response = await axios.get('/api/user-chats');
      set({ chats: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch chats', isLoading: false });
    }
  },

  fetchChatDetails: async (chatId: number) => {
    try {
      set({ isLoading: true });
      const response = await axios.get(`/api/chats/${chatId.toString()}`);
      set({ currentChat: response.data, isLoading: false });
      useWebSocket.getState().joinRoom(chatId);
    } catch (error) {
      set({ error: 'Failed to fetch chat details', isLoading: false });
    }
  },

  fetchMessages: async (chatId: number) => {
    try {
      set({ isLoading: true });
      const response = await axios.get(`/api/chats/${chatId.toString()}/messages`);
      set({ messages: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch messages', isLoading: false });
    }
  },

  sendMessage: async (chatId: number, content: string, image?: string) => {
    try {
      set({ isLoading: true });
      const response = await axios.post(`/api/chats/${chatId.toString()}/messages`, {
        content,
        image,
      });
      const newMessage = response.data as Message;
      set((state) => ({
        messages: [...state.messages, newMessage],
        isLoading: false,
      }));
      useWebSocket.getState().sendMessage(newMessage);
    } catch (error) {
      set({ error: 'Failed to send message', isLoading: false });
    }
  },

  deleteMessage: async (messageId: number) => {
    try {
      await axios.delete(`/api/messages/${messageId.toString()}`);
      set((state) => ({
        messages: state.messages.filter((msg) => msg.id !== messageId),
      }));
    } catch (error) {
      set({ error: 'Failed to delete message' });
    }
  },

  createChat: async (userIds: number[]) => {
    try {
      set({ isLoading: true });
      const response = await axios.post('/api/chats', { userIds });
      set((state) => ({
        chats: [...state.chats, response.data],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to create chat', isLoading: false });
    }
  },

  leaveChat: async (chatId: number) => {
    try {
      await axios.delete(`/api/chats/${chatId.toString()}/leave`);
      set((state) => ({
        chats: state.chats.filter((chat) => chat.chatId !== chatId),
        currentChat: null,
      }));
      useWebSocket.getState().leaveRoom(chatId);
    } catch (error) {
      set({ error: 'Failed to leave chat' });
    }
  },

  setCurrentChat: (chat: Chat | null) => {
    set({ currentChat: chat });
  },

  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  updateMessage: (message: Message) => {
    set((state) => ({
      messages: state.messages.map((msg) => 
        msg.id === message.id ? message : msg
      ),
    }));
  },

  removeMessage: (messageId: number) => {
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    }));
  },
}));

// Thiết lập WebSocket listeners
useWebSocket.subscribe((state) => {
  if (state.socket) {
    state.socket.on('new-message', (message: Message) => {
      useChat.getState().addMessage(message);
    });

    state.socket.on('message-updated', (message: Message) => {
      useChat.getState().updateMessage(message);
    });

    state.socket.on('message-deleted', (messageId: number) => {
      useChat.getState().removeMessage(messageId);
    });
  }
});