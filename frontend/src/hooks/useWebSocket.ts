// src/stores/useWebSocket.ts

import { create } from 'zustand';
import io, { Socket } from 'socket.io-client';
import { Message } from '@/types/chat';

interface WebSocketStore {
  socket: Socket | null;
  isConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  sendMessage: (message: Partial<Message>) => void;
  joinRoom: (chatId: number) => void;
  leaveRoom: (chatId: number) => void;
}

const SOCKET_URL: string = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const useWebSocket = create<WebSocketStore>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (token: string) => {
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      set({ isConnected: true });
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
      console.log('WebSocket disconnected');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  sendMessage: (message: Partial<Message>) => {
    const { socket } = get();
    if (socket) {
      socket.emit('message', message);
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