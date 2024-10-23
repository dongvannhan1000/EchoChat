export interface Chat {
  id: number;
  name: string;
  avatar?: string;
  time?: string;
  lastMessage?: string;
  unread: number;
}