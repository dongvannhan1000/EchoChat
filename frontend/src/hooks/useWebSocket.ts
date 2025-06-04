// src/stores/useWebSocket.ts

import { create } from 'zustand';
import io, { Socket } from 'socket.io-client';
import { Chat, Message } from '@/types/chat';
import { useChat } from '@/stores/useChat';
import { useChatStore } from '@/stores/useChatV2';

interface WebSocketStore {
  socket: Socket | null;
  isConnected: boolean;
  isInitialized: boolean;
  initializeSocket: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (message: Partial<Message>) => void;
  deleteMessage: (messageId:number) => void;
  sendMessageUpdate: (message: Message) => void;
  sendStatusUpdate: (message: string) => void;
  joinRoom: (chatId: number) => void;
  leaveRoom: (chatId: number) => void;
  sendBlockUser: (userId: number) => void;
  sendUnblockUser: (userId: number) => void;
}

const SOCKET_URL: string = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const connectWebSocket = async (token: string): Promise<Socket> => {
  console.log('Attempting to connect with token:', token.substring(0, 10) + '...');
  const socket = io(SOCKET_URL, {
    auth: { token }, 
    transports: ['websocket', 'polling'], 
    withCredentials: true,
  });

  return new Promise((resolve, reject) => {
    // Set timeout for connection
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error('Connection timeout'));
    }, 10000); // 10 seconds timeout

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      clearTimeout(timeout);
      reject(error);
    });

    socket.on('connect', () => {
      
      socket.on('disconnect', () => {
      });

      socket.on('error', (error) => {
        console.error('Connection error details:', {
          message: error.message,
          data: error.data,
          description: error.description
        });
      });

      socket.on('receive-message', (data: { message: Message, updatedChat: Chat }) => {
        
        

        const currentChat = useChatStore.getState().currentChat;
        if (currentChat && currentChat.id === data.message.chatId) {
          useChat.getState().addMessage(data.message);
          useChatStore.getState().setCurrentChat(data.updatedChat);
        }

        void useChatStore.getState().fetchUserChats()
      });

      socket.on('message-updated', (message: Message) => {
        useChat.getState().setEditMessage(message);
        void useChatStore.getState().fetchUserChats()
      });

      socket.on('message-deleted', (message: Message) => {;
        useChat.getState().deleteMessage(message);
        void useChatStore.getState().fetchUserChats()
      });

      socket.on('user-blocked', async (data: { userId: number, blockedId: number }) => {;
        console.log('User blocked event received:', data);
        await useChatStore.getState().fetchUserChats()
      });

      socket.on('user-unblocked', async (data: { userId: number, blockedId: number }) => {;
        console.log('User unblocked event received:', data);
        await useChatStore.getState().fetchUserChats()
      });



      



      clearTimeout(timeout);
      resolve(socket);
    });
  });
};

export const useWebSocket = create<WebSocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  isInitialized: false,

  initializeSocket: async (token: string) => {
    try {
      const socket = await connectWebSocket(token);
      set({ socket, isConnected: true, isInitialized: true });
    } catch (error) {
      console.error('Socket connection failed:', error);
    }
  },

  disconnect: async (): Promise<void> => {
    const { socket } = get();
    if (!socket) return;

    return new Promise<void>((resolve) => {
      socket.on('disconnect', () => {
        set({ socket: null, isConnected: false, isInitialized: false });
        resolve();
      });
      socket.disconnect();
    });
  },

  sendMessage: (message: Partial<Message>) => {
    const { socket } = get();
    if (socket && socket.connected) {
      // void useChatStore.getState().fetchUserChats()
      socket.emit('send-message', message);
    } else {
      console.error('Socket not connected');
    }
  },

  deleteMessage: (messageId: number) => {
    const { socket } = get();
    if (socket) {
      void useChatStore.getState().fetchUserChats()
      socket.emit('delete-message', messageId);
    }
  },

  sendMessageUpdate: (message: Message) => {
    const { socket } = get();
    if (socket) {
      socket.emit('updated-message', message); 
    }
  },

  sendStatusUpdate: (message: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('status_update', { message });
    }
  },

  joinRoom: (chatId: number) => {
    const { socket } = get();
    if (socket) {
      socket.emit('join-room', chatId);
    }
  },

  leaveRoom: (chatId: number) => {
    const { socket } = get();
    if (socket) {
      socket.emit('leave-room', chatId);
    }
  },

  sendBlockUser: (userId: number) => {
    const { socket } = get();
    if (socket) {
      socket.emit('block-user', { blockedId: userId });
    }
  },

  sendUnblockUser: (userId: number) => {
    const { socket } = get();
    if (socket) {
      socket.emit('unblock-user', { blockedId: userId });
    }
  },
}));