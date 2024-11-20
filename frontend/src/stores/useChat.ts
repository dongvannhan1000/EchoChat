

// src/stores/useChat.ts
/* eslint-disable @typescript-eslint/no-unused-vars */


import { create } from 'zustand';
import { Chat, ChatRole, ChatType, Message, UserChat } from '../types/chat';
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
  
  // Existing actions
  fetchUserChats: () => Promise<void>;
  fetchChatDetails: (chatId: number) => Promise<void>;
  fetchMessages: (chatId: number, reset?: boolean) => Promise<void>;
  sendMessage: (chatId: number, content: string, image?: string, replyToId?: number) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  createChat: (userIds: number[], chatType?: ChatType, groupName?: string, groupAvatar?: string) => Promise<void>;
  leaveChat: (chatId: number) => Promise<void>;
  
  editMessage: (messageId: number, content: string) => Promise<void>;
  markMessageAsRead: (chatId: number) => Promise<void>;
  pinChat: (chatId: number, pinned: boolean) => Promise<void>;
  muteChat: (chatId: number, mutedUntil: Date) => Promise<void>;
  blockUser: (userId: number) => Promise<void>;
  unblockUser: (userId: number) => Promise<void>;
  updateGroupChat: (chatId: number, groupName?: string, groupAvatar?: string) => Promise<void>;
  addUsersToGroup: (chatId: number, userIds: number[]) => Promise<void>;
  removeUserFromGroup: (chatId: number, userId: number) => Promise<void>;
  changeUserRole: (chatId: number, userId: number, newRole: ChatRole) => Promise<void>;
  updateStatusMessage: (message: string) => Promise<void>;

  // Utility actions
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
      set({
        isLoading: { ...get().isLoading, [action]: true },
        error: { ...get().error, [action]: null },
        messages: [], 
        messagePage: 1,
        hasMoreMessages: true
      });

      console.log('Fetching details for chat ID:', chatId);
      const response = await api.get(`/api/chats/${chatId.toString()}`);
      set({
        currentChat: response.data,
        isLoading: { ...get().isLoading, [action]: false }
      });

      const updatedState = get();
      console.log('Updated current chat:', updatedState.currentChat);
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

  editMessage: async (messageId: number, content: string) => {
    const action = 'editMessage';
    try {
      set(state => ({
        isLoading: { ...state.isLoading, [action]: true },
        error: { ...state.error, [action]: null },
      }));

      const response = await api.put(`/api/messages/${messageId}`, { content });
      const updatedMessage = response.data;
      
      set(state => ({
        messages: state.messages.map(msg => 
          msg.id === messageId ? { ...msg, content, isEdited: true } : msg
        ),
      }));

      useWebSocket.getState().sendMessageUpdate(updatedMessage);
    } catch (error) {
      set(state => ({
        error: { ...state.error, [action]: 'Failed to edit message' },
      }));
    } finally {
      set(state => ({
        isLoading: { ...state.isLoading, [action]: false },
      }));
    }
  },

  markMessageAsRead: async (chatId: number) => {
    const action = 'markMessageAsRead';
    try {
      await api.post(`/api/chats/${chatId}/read`);
      set(state => ({
        chats: state.chats.map(chat =>
          chat.chatId === chatId ? { ...chat, isSeen: true } : chat
        ),
      }));
    } catch (error) {
      set(state => ({
        error: { ...state.error, [action]: 'Failed to mark as read' },
      }));
    }
  },

  pinChat: async (chatId: number, pinned: boolean) => {
    const action = 'pinChat';
    try {
      await api.put(`/api/user-chats/${chatId}/pin`, { pinned });
      set(state => ({
        chats: state.chats.map(chat =>
          chat.chatId === chatId ? { ...chat, pinned } : chat
        ),
      }));
    } catch (error) {
      set(state => ({
        error: { ...state.error, [action]: 'Failed to pin/unpin chat' },
      }));
    }
  },

  muteChat: async (chatId: number, mutedUntil: Date) => {
    const action = 'muteChat';
    try {
      await api.put(`/api/user-chats/${chatId}/mute`, { mutedUntil });
      set(state => ({
        chats: state.chats.map(chat =>
          chat.chatId === chatId ? { ...chat, mutedUntil } : chat
        ),
      }));
    } catch (error) {
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
      await get().fetchUserChats();
      
    } catch (error) {
      set(state => ({
        error: { ...state.error, [action]: 'Failed to unblock user' },
      }));
    } finally {
      set(state => ({
        isLoading: { ...state.isLoading, [action]: false },
      }));
    }
  },

  updateGroupChat: async (chatId: number, groupName?: string, groupAvatar?: string) => {
    const action = 'updateGroupChat';
    try {
      const response = await api.put(`/api/chats/${chatId}`, {
        groupName,
        groupAvatar,
      });
      
      set(state => ({
        currentChat: state.currentChat?.id === chatId
          ? { ...state.currentChat, groupName, groupAvatar }
          : state.currentChat,
        chats: state.chats.map(chat =>
          chat.chatId === chatId
            ? { ...chat, chat: { ...chat.chat!, groupName, groupAvatar } }
            : chat
        ),
      }));
    } catch (error) {
      set(state => ({
        error: { ...state.error, [action]: 'Failed to update group' },
      }));
    }
  },

  addUsersToGroup: async (chatId: number, userIds: number[]) => {
    const action = 'addUsersToGroup';
    try {
      const response = await api.post(`/api/chats/${chatId}/users`, { userIds });
      const updatedChat = response.data;
      
      set(state => ({
        currentChat: state.currentChat?.id === chatId
          ? updatedChat
          : state.currentChat,
      }));
    } catch (error) {
      set(state => ({
        error: { ...state.error, [action]: 'Failed to add users to group' },
      }));
    }
  },

  removeUserFromGroup: async (chatId: number, userId: number) => {
    const action = 'removeUserFromGroup';
    try {
      set(state => ({
        isLoading: { ...state.isLoading, [action]: true },
        error: { ...state.error, [action]: null },
      }));

      await api.delete(`/api/chats/${chatId}/users/${userId}`);
      
      // Update the current chat's participant list
      set(state => ({
        currentChat: state.currentChat?.id === chatId
          ? {
              ...state.currentChat,
              participants: state.currentChat.participants?.filter(
                p => p.userId !== userId
              ),
            }
          : state.currentChat,
      }));

      // If the removed user is the current user, leave the chat
      const currentUserId = getCurrentUserId(); // You'll need to implement this
      if (userId === currentUserId) {
        await get().leaveChat(chatId);
      }
      
    } catch (error) {
      set(state => ({
        error: { ...state.error, [action]: 'Failed to remove user from group' },
      }));
    } finally {
      set(state => ({
        isLoading: { ...state.isLoading, [action]: false },
      }));
    }
  },

  changeUserRole: async (chatId: number, userId: number, newRole: ChatRole) => {
    const action = 'changeUserRole';
    try {
      await api.put(`/api/chats/${chatId}/users/${userId}/role`, { role: newRole });
      
      set(state => ({
        currentChat: state.currentChat?.id === chatId
          ? {
              ...state.currentChat,
              participants: state.currentChat.participants?.map(p =>
                p.userId === userId ? { ...p, role: newRole } : p
              ),
            }
          : state.currentChat,
      }));
    } catch (error) {
      set(state => ({
        error: { ...state.error, [action]: 'Failed to change user role' },
      }));
    }
  },

  updateStatusMessage: async (message: string) => {
    const action = 'updateStatusMessage';
    try {
      set(state => ({
        isLoading: { ...state.isLoading, [action]: true },
        error: { ...state.error, [action]: null },
      }));

      await api.put(`/api/users/status`, { statusMessage: message });
      
      // Optionally update local state if you're storing user data
      // You might want to update this in a separate user store instead
      
      // Notify other users through WebSocket
      useWebSocket.getState().sendStatusUpdate(message);
      
    } catch (error) {
      set(state => ({
        error: { ...state.error, [action]: 'Failed to update status message' },
      }));
    } finally {
      set(state => ({
        isLoading: { ...state.isLoading, [action]: false },
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
