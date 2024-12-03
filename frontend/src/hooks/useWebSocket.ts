// src/stores/useWebSocket.ts

import { create } from 'zustand';
import io, { Socket } from 'socket.io-client';
import { Message } from '@/types/chat';
import { useChat } from '@/stores/useChat';

interface WebSocketStore {
  socket: Socket | null;
  isConnected: boolean;
  isInitialized: boolean;
  connect: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (message: Partial<Message>) => void;
  deleteMessage: (messageId:number) => void;
  sendStatusUpdate: (message: string) => void;
  joinRoom: (chatId: number) => void;
  leaveRoom: (chatId: number) => void;
}

const SOCKET_URL: string = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const connectWebSocket = async (token: string): Promise<Socket> => {
  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  return new Promise((resolve, reject) => {
    // Set timeout for connection
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error('Connection timeout'));
    }, 10000); // 10 seconds timeout

    socket.on('connect', () => {
      clearTimeout(timeout);
      resolve(socket);
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
};

export const useWebSocket = create<WebSocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  isInitialized: false,

  connect: async (token: string): Promise<void> => {
    const { socket, isInitialized } = get();
    
    if (socket || isInitialized) return;

    try {
      const newSocket = await connectWebSocket(token);

      newSocket.on('disconnect', () => {
        set({ isConnected: false });
        console.log('WebSocket disconnected');
      });

      newSocket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

  
      newSocket.on('message-updated', (message: Message) => {
        useChat.getState().updateMessage(message);
      });
  

      set({ 
        socket: newSocket, 
        isConnected: true,
        isInitialized: true 
      });
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      throw error; // Re-throw để caller có thể handle
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
    if (socket) {
      socket.emit('message', message);
    }
  },

  deleteMessage: (messageId: number) => {
    const { socket } = get();
    if (socket) {
      socket.emit('delete-message', messageId);
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
}));