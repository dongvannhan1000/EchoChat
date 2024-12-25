import { create } from 'zustand';
import { Message, MessageType } from '../types/chat';
import api from '../utils/axios';
import { useWebSocket } from '../hooks/useWebSocket';

interface MessagesStore {
  messages: Message[];
  hasMoreMessages: boolean;
  isLoading: { [key: string]: boolean };
  error: { [key: string]: string | null };

  fetchMessages: (chatId: number, reset?: boolean) => Promise<void>;
  sendMessage: (chatId: number, content: string, image?: string) => Promise<void>;
  sendSystemMessage: (chatId: number, type: MessageType, content: string) => Promise<void>;
  removeMessage: (messageId: number) => Promise<void>;
  editMessage: (messageId: number, content: string, image?: string) => Promise<Message>;
}

export const useMessagesStore = create<MessagesStore>((set, get) => ({
  messages: [],
  hasMoreMessages: true,
  isLoading: {},
  error: {},

  fetchMessages: async (chatId: number, reset = false) => {
    const action = 'fetchMessages';
    try {
      const { messages, hasMoreMessages } = get();
      if (!hasMoreMessages && !reset) return;

      set((state) => ({
        isLoading: { ...state.isLoading, [action]: true },
        error: { ...state.error, [action]: null },
      }));

      const cursor = reset ? undefined : messages.length > 0 ? messages[0].id : undefined;
      
      const response = await api.get(`/api/chats/${chatId.toString()}/messages`, {
        params: {
          cursor,
          limit: 20
        }
      });

      const { messages: newMessages, hasMore } = response.data;

      set((state) => ({
        messages: reset 
          ? newMessages 
          : Array.from(
              new Map([...newMessages, ...state.messages].map(msg => [msg.id, msg])).values()
            ).sort((a, b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime()),
        hasMoreMessages: hasMore,
      }));
    } catch (error) {
      set((state) => ({
        error: { ...state.error, [action]: 'Failed to fetch messages' },
        hasMoreMessages: false,
      }));
    } finally {
      set((state) => ({
        isLoading: { ...state.isLoading, [action]: false },
      }));
    }
  },

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
        messages: [...state.messages, newMessage].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
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

  sendSystemMessage: async (
    chatId: number,
    type: MessageType,  
    content: string
  ) => {
    const action = 'sendSystemMessage';
    try {
      set((state) => ({
        isLoading: { ...state.isLoading, [action]: true },
        error: { ...state.error, [action]: null },
      }));

      console.log(type)
  
      const response = await api.post(`/api/chats/${chatId.toString()}/messages`, {
        content,
        type: 'system',
      });
  
      const newSystemMessage = response.data as Message;
      set((state) => ({
        messages: [...state.messages, newSystemMessage].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
      }));
  
      useWebSocket.getState().sendMessage(newSystemMessage);
    } catch (error) {
      set((state) => ({
        error: { ...state.error, [action]: 'Failed to send system message' },
      }));
      
      throw error;
    } finally {
      set((state) => ({
        isLoading: { ...state.isLoading, [action]: false },
      }));
    }
  },

  removeMessage: async (messageId: number) => {
    const action = 'deleteMessage';
    console.log('Delete message')
    try {
      const { data: updatedMessage } = await api.delete(`/api/messages/${messageId.toString()}`);

    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, content: updatedMessage.content, deletedAt: updatedMessage.deletedAt }
          : msg
      ),
    }));

    useWebSocket.getState().deleteMessage(messageId);
    } catch (error) {
      set((state) => ({
        error: { ...state.error, [action]: 'Failed to delete message' },
      }));
    }
  },

  editMessage: async (messageId: number, content: string, image?: string) => {
    const action = 'editMessage';
    try {
      set(state => ({
        isLoading: { ...state.isLoading, [action]: true },
        error: { ...state.error, [action]: null },
      }));

      const payload: { newContent?: string; newImage?: string } = {};
      if (content) payload.newContent = content;
      if (image) payload.newImage = image;

      const response = await api.put(`/api/messages/${(messageId).toString()}`, payload);
      const updatedMessage = response.data;
      
      set(state => ({
        messages: state.messages.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                content: updatedMessage.content, 
                image: updatedMessage.image, 
                isEdited: true 
              } 
            : msg
        ),
      }));

      useWebSocket.getState().sendMessageUpdate(updatedMessage as Message);

      return updatedMessage;
    } catch (error) {
      set(state => ({
        error: { ...state.error, [action]: 'Failed to edit message' },
      }));
      throw error;
    } finally {
      set(state => ({
        isLoading: { ...state.isLoading, [action]: false },
      }));
    }
  }
}))