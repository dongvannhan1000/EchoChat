// src/types/chat.ts

export type ChatType = 'private' | 'group';
export type ChatRole = 'admin' | 'member';

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
  content?: string;
  image?: string;
  isEdited: boolean;
  replyToId?: number;
  deletedAt?: Date;
  createdAt: Date;
  sender: User;
}

export interface Chat {
  id: number;
  chatType: ChatType;
  groupName?: string;
  groupAvatar?: string;
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
  lastMessage?: string;
  isSeen: boolean;
  role: ChatRole;
  mutedUntil?: Date;
  pinned: boolean;
  updatedAt: Date;
}