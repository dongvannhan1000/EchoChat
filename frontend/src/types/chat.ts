// src/types/chat.ts

export type ChatType = 'private' | 'group';
export type ChatRole = 'admin' | 'member';
export type MessageType = 'normal' | 'system';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: Image | null;
  block: number[];
  statusMessage: string | null;
  lastSeen: Date | null;
  messages: Message[];
  chats: UserChat[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: number;
  chatType: ChatType;
  groupName: string | null;
  groupAvatarId: number | null;
  groupAvatar: Image | null;
  createdBy: number;
  lastMessage: string | null;
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

export interface Message {
  id: number;
  chatId: number;
  senderId: number;
  chat: Chat;
  sender: User;
  type: MessageType;
  content: string;
  imageId: number | null;
  image: Image | null;
  isEdited: boolean;
  replyToId: number | null;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface Image {
  id?: number;
  url: string;
  key?: string;
  userId: number | null;
  user?: User | null;
  message?: Message | null;
}