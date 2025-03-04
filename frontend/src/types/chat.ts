// src/types/chat.ts

export type ChatType = 'private' | 'group';
export type ChatRole = 'admin' | 'member';
export type MessageType = 'normal' | 'system';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  block: number[];
  statusMessage?: string;
  lastSeen?: Date;
}

export interface Message {
  id: number;
  chatId: number;
  senderId: number;
  type: MessageType;
  content: string;
  image?: string;
  isEdited: boolean;
  replyToId?: number;
  deletedAt?: Date;
  createdAt: Date;
  sender: User;
  chat: Chat;
}

export interface Chat {
  id: number;
  chatType: ChatType;
  groupName?: string;
  groupAvatar?: string;
  lastMessage?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  participants: UserChat[];
}

export interface UserChat {
  id: number;
  userId: number;
  chatId: number;
  user: User;
  chat: Chat;
  isSeen: boolean;
  role: ChatRole;
  mutedUntil: Date | null;
  pinned: boolean;
  updatedAt: Date;
}